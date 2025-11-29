import requests
from bs4 import BeautifulSoup
import pandas as pd
import time
import re

LEAGUE_URL = "https://www.psmf.cz/souteze/2025-hanspaulska-liga-podzim"
LEAGUES = [
        "1-a",
        "2-a", "2-b",
        "3-a", "3-b", "3-c", "3-d",
        "4-a", "4-b", "4-c", "4-d", "4-e", "4-f",
        "5-a", "5-b", "5-c", "5-d", "5-e", "5-f", "5-g", "5-h", "5-i",
        "6-a", "6-b", "6-c", "6-d", "6-e", "6-f", "6-g", "6-h", "6-i", "6-j", "6-k", "6-l",
        "7-a", "7-b", "7-c", "7-d", "7-e", "7-f", "7-g", "7-h", "7-i", "7-j", "7-k", "7-l",
        "8-a", "8-b", "8-c", "8-d", "8-e", "8-f", "8-g", "8-h", "8-i", "8-j", "8-k", "8-l", "8-m", "8-n"
    ]


def get_soup(url):
    try:
        r = requests.get(url)
        r.encoding = 'utf-8'
        return BeautifulSoup(r.text, 'html.parser'), r
    except Exception as e:
        print(f"Error: {e}")
        return None, None

def extract_matches_links(html_content, round_num, league):
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
                home_team = team_links[0].get_text(strip=True)
                away_team = team_links[1].get_text(strip=True)


                matches.append({
                    "League": league,
                    "Round": round_num,
                    "Date": date_text,
                    "Time": cols[1].get_text(strip=True),
                    "Field": cols[2].get_text(strip=True),
                    "Home Team": home_team,
                    "Away Team": away_team,
                })
    return matches

def scrape_league(base_url, league):
    soup, _ = get_soup(base_url + "/" + league)
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
            round_data = extract_matches_links(html_to_parse, i, league)
            
            all_matches.extend(round_data)

                
        except Exception as e:
            print(f"Error Round {i}: {e}")
        time.sleep(0.5)

    return all_matches




if __name__ == "__main__":

    headers = ["League", "Round", "Date", "Time", "Field", "Home Team", "Away Team"]
    pd.DataFrame(columns=headers).to_csv("matches.csv", index=False, encoding='utf-8-sig')   
    
    # Scrapping all the leagues
    for league in LEAGUES:
        data = scrape_league(LEAGUE_URL, league)
        df = pd.DataFrame(data)
        df.to_csv("matches.csv", mode='a', header=False, index=False, encoding='utf-8-sig')
        print(f"{league} done")
    
    
