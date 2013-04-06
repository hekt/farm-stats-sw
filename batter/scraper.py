import scraperwiki
import lxml.html
import datetime

YEAR = '2013'

STATS = ['bats', 'name', 'g', 'pa', 'ab', 'r', 'h', 'dbl', 'tpl', 'hr', 'tb',
         'rbi', 'sb', 'cs', 'sh', 'sf', 'bb', 'ibb', 'hbp', 'so', 'gd']
STATS_LENGTH = len(STATS)
EASTS = ['f', 'g', 'e', 's', 'l', 'db', 'm']
WESTS = ['d', 'h', 't', 'bs', 'c']

BASE_URL = "http://bis.npb.or.jp/%s/stats/idb2_%s.html"

def main():
    def east():
        total = {}
        for team in EASTS:
            result = scrapeAndSave(team)
            total = calcTotal(total, result)
        return total
    def west():
        total = {}
        for team in WESTS:
            result = scrapeAndSave(team)
            total = calcTotal(total, result)
        return total

    east_total = east()
    west_total = west()
    east_total.update({'team': 'league', 'bats': None, 'name': 'east'})
    west_total.update({'team': 'league', 'bats': None, 'name': 'west'})
    scraperwiki.sqlite.save(unique_keys=['name'], data=east_total)
    scraperwiki.sqlite.save(unique_keys=['name'], data=west_total)

def scrapeAndSave(team):
    url = BASE_URL % (YEAR, team)
    html = scraperwiki.scrape(url)
    root = lxml.html.fromstring(html)
    trs = root.cssselect("div#stdivmaintbl tr.ststats")[1:]

    total = {}

    for tr in trs:
        if tr.cssselect("td.stplayer"):
            tds = tr.cssselect("td")
            contents = map(lambda x: x.text_content(), tds)
            for i in range(2, STATS_LENGTH):
                contents[i] = int(contents[i])
            
            data = zipdict(STATS, contents)
            data.update({'team': team, 'year': YEAR})
            
            scraperwiki.sqlite.save(unique_keys=['name', 'team', 'year'],
                                    data=data)
            total = calcTotal(total, data)

    return total

def calcTotal(total, current):
    if total:
        for k in STATS[2:]:
            total[k] = total[k] + current[k]
    else:
        for k in STATS[2:]:
            total[k] = current[k]
    return total

def zipdict(ks, vs):
    return dict(zip(ks, vs))

main()
