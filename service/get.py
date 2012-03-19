import web
import psycopg2
import geojson

urls = (
    '/.*', 'getcandidate'
)

app = web.application(urls, globals(), autoreload=False)
application = app.wsgifunc()

class getcandidate:        
    def GET(self):
        conn = psycopg2.connect("host=localhost dbname=bexp user=osm password=osm")
        cur = conn.cursor()
        cur.execute("SELECT ST_X(the_geom),ST_Y(the_geom), nbi_id FROM nbi_nonmatch ORDER BY RANDOM() LIMIT 1")
        recs = cur.fetchall()
        (x,y,nbi_id) = recs[0]
        p=geojson.Point([x,y])
        f=geojson.Feature(geometry=p,id=nbi_id)
        return geojson.dumps(f)

if __name__ == "__main__":
    app.run()
