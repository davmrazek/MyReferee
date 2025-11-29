import requests
from bs4 import BeautifulSoup
import pandas as pd
import time
import re

# --- CONFIGURATION ---
LEAGUE_URL = "https://www.psmf.cz/souteze/2025-hanspaulska-liga-podzim/8-a/"

def get_soup(url):
    try:
        r = requests.get(url)
        r.encoding = 'utf-8'
        return BeautifulSoup(r.text, 'html.parser'), r
    except Exception as e:
        print(f"Error: {e}")
        return None, None

def extract_matches_links(html_content, round_num):
    soup = BeautifulSoup(html_content, 'html.parser')
    matches = []
    
    rows = soup.find_all('tr')
    for row in rows:
        cols = row.find_all('td')
        if len(cols) >= 4:
            # Clean Date
            date_text = re.sub(r'\s+', ' ', cols[0].get_text()).strip()
            
            if len(date_text) > 2 and "Datum" not in date_text:
                team_links = cols[3].find_all('a')
                
                home_team = "Unknown"
                away_team = "Unknown"
                
                # We expect 2 links (Home and Away)
                if len(team_links) >= 2:
                    home_team = team_links[0].get_text(strip=True)
                    away_team = team_links[1].get_text(strip=True)


                matches.append({
                    "Round": round_num,
                    "Date": date_text,
                    "Time": cols[1].get_text(strip=True),
                    "Field": cols[2].get_text(strip=True),
                    "Home Team": home_team,
                    "Away Team": away_team,
                })
    return matches

def scrape_final_season(base_url):
    soup, _ = get_soup(base_url)
    if not soup: return []

    secret_link = soup.find('a', {'data-url': re.compile(r'round=')})
    if not secret_link: return []

    raw_api_path = secret_link['data-url']
    base_api_url = "https://www.psmf.cz" + re.sub(r'round=\d+', 'round={}', raw_api_path)
    
    all_matches = []
    
    for i in range(1, 12):
        target_url = base_api_url.format(i)
        try:
            r = requests.get(target_url)
            r.encoding = 'utf-8'
            
            try:
                json_data = r.json()
                html_to_parse = ""
                if 'snippets' in json_data:
                    for k in json_data['snippets']: html_to_parse += json_data['snippets'][k]
                else: html_to_parse = str(json_data)
            except:
                html_to_parse = r.text

            # Use the LINK extractor
            round_data = extract_matches_links(html_to_parse, i)
            
            all_matches.extend(round_data)

                
        except Exception as e:
            print(f"Error Round {i}: {e}")
        time.sleep(0.5)

    return all_matches

if __name__ == "__main__":
    data = scrape_final_season(LEAGUE_URL)
    if data:
        df = pd.DataFrame(data)
        df.to_csv("matches.csv", index=False, encoding='utf-8-sig')
        print("Success!")