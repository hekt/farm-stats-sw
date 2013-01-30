import scraperwiki
import lxml.html
import datetime

STATS = ['bats', 'name', 'g', 'pa', 'ab', 'r', 'h', 'dbl', 'tpl', 'hr', 'tb',
         'rbi', 'sb', 'cs', 'sh', 'sf', 'bb', 'ibb', 'hbp', 'so', 'gd']
STATS_LENGTH = len(STATS)
EASTS = ['f', 'g', 'e', 's', 'l', 'db', 'm']
WESTS = ['d', 'h', 't', 'bs', 'c']

YEAR = '2012'

BASE_URL = "http://bis.npb.or.jp/%s/stats/idb2_%s.html"

def main():
    save = lambda d: scraperwiki.sqlite.save(unique_keys=['name'], data=d)

    def f(teams):
        for team in teams:
            datas = getPlayers(team)
            map(save, datas)
            total = dictSum(datas, STATS[2:])
        return total

    east_total = f(EASTS)
    west_total = f(WESTS)
    east_total.update({'team': 'league', 'bats': None, 'name': 'east'})
    west_total.update({'team': 'league', 'bats': None, 'name': 'west'})
    save(east_total)
    save(west_total)


def getPlayers(team):
    url = BASE_URL % (YEAR, team)
    html = scraperwiki.scrape(url)
    root = lxml.html.fromstring(html)
    trs = root.cssselect("div#stdivmaintbl tr.ststats")[1:]

    players = []
    for tr in trs:
        if tr.cssselect("td.stplayer"):
            tds = tr.cssselect("td")
            contents = map(lambda x: x.text_content(), tds)
            for i in range(2, STATS_LENGTH):
                contents[i] = int(contents[i])

            data = zipdict(STATS, contents)
            data.update({'team': team})
            players.append(data)

    return players


def dictSum(dics, keys=None):
    if keys is None:
        keys = dics.keys()
        total = dics[0]
    else:
        total = {}
        for k in keys:
            total[k] = dics[0][k]
            
    for data in dics[1:]:
        for k in keys:
            total[k] = total[k] + data[k]

    return total


def zipdict(ks, vs):
    return dict(zip(ks, vs))


main()
