var GeoCommon = function () {

    this.geo_first = true;
    this.geo_min_max = {
        lat: {
            min: null,
            max: null
        },
        lon: {
            min: null,
            max: null
        }
    };

    this.init = function () {

    };

    this.get_minmax = function(geojson) {
        if (geojson.geometry.type === 'Polygon' || geojson.geometry.type === 'MultiLineString') {
            this.iterate_geo(geojson.geometry.coordinates, 2);
        }
        else if (geojson.geometry.type === 'MultiPolygon') {
            this.iterate_geo(geojson.geometry.coordinates, 3);
        }
        return this.geo_min_max;
    };

    this.save_geo_min_max = function(geo) {
        if (geo[0] < this.geo_min_max.lon.min)
            this.geo_min_max.lon.min = geo[0];
        if (geo[0] > this.geo_min_max.lon.max)
            this.geo_min_max.lon.max = geo[0];
        if (geo[1] < this.geo_min_max.lat.min)
            this.geo_min_max.lat.min = geo[1];
        if (geo[1] > this.geo_min_max.lat.max)
            this.geo_min_max.lat.max = geo[1];
    };

    this.iterate_geo = function(data, level) {
        if (level > 0) {
            for (var i = 0; i < data.length; i++) {
                this.iterate_geo(data[i], level - 1);
            }
        }
        else {
            if (this.geo_first) {
                this.geo_first = false;
                this.geo_min_max.lon.min = this.geo_min_max.lon.max = data[0];
                this.geo_min_max.lat.min = this.geo_min_max.lat.max = data[1];
            }
            else {
                this.save_geo_min_max(data);
            }
        }
    };
};