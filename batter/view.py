import os
import cgi
import json

import scraperwiki
import sqlite3

BASIC_STATS = ['bats', 'name', 'g', 'pa', 'ab', 'r', 'h', 'dbl', 'tpl', 'hr', 
               'tb', 'rbi', 'sb', 'cs', 'sh', 'sf', 'bb', 'ibb', 'hbp', 'so', 
               'gd']

def row2statsDic(data):
    stats = {}
    for k in BASIC_STATS:
        stats[k] = data[k]

    return stats


def calcStats(data):
    h = float(data['h'])                # hits
    ab = float(data['ab'])              # at bats
    dbl = float(data['dbl'])            # doules
    tpl = float(data['tpl'])            # triples
    hr = float(data['hr'])              # homeruns
    tb = float(data['tb'])              # total bases
    bb = float(data['bb'])              # bases on balls
    ibb = float(data['ibb'])            # intentional bbs
    hbp = float(data['hbp'])            # hit by pitches
    sh = float(data['sh'])              # sacrifice hits
    sf = float(data['sf'])              # sacrifice flies
    sb = float(data['sb'])              # stolen bases
    cs = float(data['cs'])              # caught stealing
    so = float(data['so'])              # strike outs
    gd = float(data['gd'])              # ground doubles
    sgl = h - dbl - tpl - hr            # singles
    
    avg = h / ab \
          if ab else None
    slg = tb / ab \
          if ab else None
    obp_a = h + bb + hbp
    obp_b = ab + bb + hbp + sf
    obp = obp_a / obp_b \
          if obp_b else None
    ops = slg + obp
    noi = (obp + slg / 3) * 1000
    gpa = (obp * 1.8 + slg) / 4

    rc_a = h + bb + hbp - cs - gd
    rc_b = tb + 0.26 * (bb + hbp) + 0.53 * (sh + sf) + 0.64 * sb - 0.03 * so
    rc_c = ab + bb + hbp + sf + sh
    rc = (2.4 * rc_c + rc_a) * (3 * rc_c + rc_b) / (9 * rc_c) - 0.9 * rc_c\
         if rc_c else None
    rc27_a = ab - h + cs + sh + sf + gd
    rc27 = rc / rc27_a * 27 \
           if rc27_a else None

    xr = 0.50 * sgl + 0.72 * dbl + 1.04 * tpl + 1.44 * hr + \
         0.34 * (bb + hbp) + 0.25 * ibb + 0.18 * sb - 0.32 * cs - \
         0.09 * (ab - h - so) - 0.37 * gd + 0.37 * sf + 0.04 * sh
    xr27_a = rc27_a
    xr27 = xr / xr27_a * 27 \
           if xr27_a else None

    babip_a = h - hr
    babip_b = ab + sf - hr - so
    babip = babip_a / babip_b \
            if babip_b else None

    isop = slg - avg \
           if (avg and slg) else None
    isod = obp - avg \
           if (avg and obp) else None

    def avgJust(n):
        return str(n)[1:5].ljust(4, '0') if n < 1 else \
               str(n)[0:5].ljust(5, '0')
    def rcJust(n):
        nn = round(n)
        idx = str(nn).index('.')
        return str(nn)[:idx] + str(nn)[idx:].ljust(2, '0')

    avg = avgJust(avg)
    slg = avgJust(slg)
    obp = avgJust(obp)
    ops = avgJust(ops)
    gpa = avgJust(gpa)
    noi = round(noi, 1)
    rc = rcJust(rc)
    rc27 = rcJust(rc27)
    xr = rcJust(xr)
    xr27 = rcJust(xr27)
    babip = avgJust(babip)
    isop = avgJust(isop)
    isod = avgJust(isod)

    return {'avg': avg, 'slg': slg, 'obp': obp, 'ops': ops, 'noi': noi,
            'gpa': gpa, 'rc': rc, 'rc27': rc27, 'xr': xr, 'xr27': xr27,
            'babip': babip, 'isop': isop, 'isod': isod}


# parse params
# paramdict = dict(cgi.parse_qsl(os.getenv("QUERY_STRING", "")))
# query = paramdict['q']
query = """* FROM swdata WHERE team = 'f' ORDER BY pa DESC LIMIT 1"""

# scraperwiki.com
# scraperwiki.sqlite.attach("npb-farm-stats-b")
# data = scraperwiki.sqlite.select(query)

# local
with sqlite3.connect("scraperwiki.sqlite") as conn:
    conn.row_factory = sqlite3.Row
    data = conn.execute('select ' + query)

stats_dic_list = []
for d in data:
    stats_dic = row2statsDic(d)
    ex_stats_dic = calcStats(d)
    stats_dic['bats'] = 'R' if stats_dic['bats'] == '' else \
                        'L' if stats_dic['bats'] == '*' else 'S'
    stats_dic.update(ex_stats_dic)
    stats_dic_list.append(stats_dic)

scraperwiki.utils.httpresponseheader("Content-Type", "application/json")
print json.dumps(stats_dic_list)
