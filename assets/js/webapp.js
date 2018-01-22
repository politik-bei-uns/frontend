var modules = {};

$(document).ready(function () {
    modules.common = new Common();
    modules.common.init();

    if ($('#sd-form').length) {
        modules.region = new Region();
        modules.region.init();
        modules.document_search = new PaperSearch();
        modules.document_search.init();
    }
    if ($('#paper-geo-form').length) {
        modules.region = new Region();
        modules.region.init();
        modules.document_search = new PaperSearch();
        modules.paper_geo = new PaperGeo();
        modules.paper_geo.init();
    }

    if ($('#paper-map').length) {
        modules.document_show = new DocumentShow();
        modules.document_show.init();
    }
    if ($('#overview-map').length) {
        modules.home_map = new HomeMap();
        modules.home_map.init();
    }

    if ($('#home-latest-documents').length) {
        modules.home_paper = new HomePaper();
        modules.home_paper.init();
    }
});











