var Region = function () {
    this.init = function () {
        $('#region-current').data('expanded', 0);
        for (i = 0; i < config.regions.length; i++) {
            $('#region-children').append('<div class="region-child" data-id="' + config.regions[i].id + '">' + config.regions[i].name + ' (<span>0</span>)</div>');
        }
        $('.region-child, #region-parent').click(function() {
            if (!$(this).hasClass('region-inactive')) {
                modules.region.select_region($(this).data('id'));
            }
        });
        $('#region-box-inner').click(function(evt) {
            evt.stopPropagation();
        });
        $('#region-current').click(function(evt) {
            if (parseInt($(this).data('expanded')) === 0) {
                evt.stopPropagation();
                $('#region-box-inner').fadeIn(200);
                $(this).data('expanded', 1);
            }
        });
        $(window).click(function() {
            $('#region-box-inner').fadeOut(200);
            $('#region-current').data('expanded', 0);
        });
    };

    this.update_region_overview = function () {
        var region_list = '<h5 data-id="root">Weltweit</h5>';
        region_list += this.get_region_list(config.regions);
        $('#region-overview .modal-body').html(region_list);
        $('#region-overview h5').click(function() {
            modules.region.select_region($(this).data('id'));
            $('#region-overview').modal('toggle');
        });
    };

    this.get_region_list = function(regions) {
        var html = '<ul>';
        for (var i = 0; i < regions.length; i++) {
            html += '<li><h5 data-id="' + regions[i].id + '">' + regions[i].name + ' (<span>0</span>)</h5>';
            if (regions[i].children) {
                html +=  this.get_region_list(regions[i].children);
            }
            html += '</li>';
        }
        html += '</ul>';
        return(html);
    };

    this.select_region = function (region_id) {
        var region = this.get_region_data(config.regions, region_id, 0);
        $('#region-current').text(region.name).data('id', region.id);
        if (region.level == 0) {
            $('#region-parent').addClass('region-inactive');
            $('#region-parent').text('Eine Ebene hoch');
        }
        else {
            $('#region-parent').removeClass('region-inactive');
            if (region.level == 1) {
                $('#region-parent').text('Weltweit');
                $('#region-parent').data('id', 'root');
            }
            else if (region.parent) {
                $('#region-parent').data('id', region.parent.id);
                $('#region-parent').html(region.parent.name + ' (<span>0</span>)');
            }
        }
        $('#region-children').html('');
        if (region.children) {
            for (i = 0; i < region.children.length; i++) {
                $('#region-children').append('<div class="region-child" data-id="' + region.children[i].id + '">' + region.children[i].name + ' (<span>0</span>)</div>');
            }
            $('.region-child').click(function () {
                modules.region.select_region($(this).data('id'));
            });
        }
        $('#sd-form').submit();
    };

    this.get_region_data = function(regions, region_id, level) {
        if (region_id === 'root') {
            return {
                name: 'Weltweit',
                id: 'root',
                level: 0,
                children: config.regions
            };
        }
        else {
            for (var i = 0; i < regions.length; i++) {
                if (regions[i].id === region_id) {
                    regions[i].level = level + 1;
                    return (regions[i]);
                }
                if (regions[i].children) {
                    child = this.get_region_data(regions[i].children, region_id, level + 1);
                    if (child) {
                        if (!child.parent) {
                            child.parent = {
                                id: regions[i].id,
                                name: regions[i].name,
                                level: level + 1
                            };
                        }
                        return (child);
                    }
                }
            }
        }
        return(false);
    };

    this.get_children_bodies = function(regions) {
        var children = [];
        for (var i = 0; i < regions.length; i++) {
            if (regions[i].body) {
                children = children.concat(regions[i].body);
            }
            if (regions[i].children) {
                children = children.concat(this.get_children_bodies(regions[i].children));
            }
        }
        return(children);
    };

    this.get_children_regions = function(regions) {
        var children = [];
        for (var i = 0; i < regions.length; i++) {
            if (regions[i].body) {
                children = children.concat(regions[i].id);
            }
            if (regions[i].children) {
                children = children.concat(this.get_children_bodies(regions[i].children));
            }
        }
        return(children);
    };

    this.update_region_list_count = function(bodies) {
        $('.region-child, #region-parent').each(function () {
            region = modules.region.get_region_data(config.regions, $(this).data('id'), 0);

            children = [];
            if (region.children) {
                 children = children.concat(modules.region.get_children_bodies(region.children));
            }
            if (region.id !== 'root' && region.body) {
                children = children.concat(region.body);
            }
            var count = 0;
            for (var i = 0; i < children.length; i++) {
                for (var j = 0; j < bodies.length; j++) {
                    if (children[i] === bodies[j].key) {
                        count += bodies[j].doc_count;
                    }
                }
            }
            $(this).find('span').text(count);
        });
    };
};