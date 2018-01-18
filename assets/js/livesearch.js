/*
Copyright (c) 2007, Ernesto Ruge
All rights reserved.
Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.
THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

jQuery.live_search = {
    // settings template
    'settings_template': {
        url: '/fast-search',
        delay: 100,
        param: 'q',
        livesearch_result_only: false,
        process_result_line: function (result) {
            return ('<li></li>');
        },
        after_submit: function () {},
        select_data: function (data) {
            return data;
        },
        reset_data: function () {},
        extend_params: function(params) { return params; }
    },
    // array to static settings
    'settings': {},
    // array to store previous value
    'previousValue': {},
    // array to store current timer
    'timer': {},
    'global': {
        'first_run': true
    },

    // init operations
    init: function (instance) {
        // Add CSS to header
        if (jQuery.live_search.global.first_run) {
            var css = "<style>";
            css += ".live-search-list {display: none; position: absolute; top: 33px; left: 0; margin: 0; right: 0; background-color: #FFFFFF; border: 1px solid #000000; text-align: left; z-index: 3000;}";
            css += ".live-search-list ul { margin: 5px 0; padding: 0; list-style: none; }";
            css += ".live-search-list li { padding: 2px 10px; cursor: pointer; }";
            css += ".live-search-list li.highlighted, #fsltl li:hover { background-color: #E1DFFF; }";
            css += "</css>";
            jQuery('html > head').append(css);
            //jQuery.live_search.global.first_run = true;
        }
        // Modify form to support live search box
        jQuery(jQuery.live_search.settings[instance]['input']).wrap('<div style="position: relative;"></div>').parent().append('<p id="' + jQuery.live_search.settings[instance]['live_box'].replace('#', '') + '" style="display: none;"></p>');
        jQuery(jQuery.live_search.settings[instance]['live_box']).attr({'class': 'live-search-list'});
        jQuery(jQuery.live_search.settings[instance]['input']).keyup(function (evt) {
            if (jQuery(jQuery.live_search.settings[instance]['input']).val() !== jQuery.live_search.previousValue[instance] && evt.keyCode != 13) {
                // reset old timer
                jQuery.live_search.resetTimer(jQuery.live_search.timer[instance]);
                // set new timeout
                jQuery.live_search.timer[instance] = setTimeout(function () {
                    jQuery.live_search.process(instance)
                }, jQuery.live_search.settings[instance]['delay']);
                // set old value
                jQuery.live_search.previousValue[instance] = jQuery(jQuery.live_search.settings[instance]['input']).val();
            }
        });
        jQuery(jQuery.live_search.settings[instance]['input']).keydown(function (evt) {
            // Enter abfangen
            if (evt.keyCode == 13) {
                evt.preventDefault();
                if (jQuery(jQuery.live_search.settings[instance].live_box + ' li.highlighted').length && jQuery(jQuery.live_search.settings[instance].input).val()) {
                    jQuery(jQuery.live_search.settings[instance].live_box + ' li.highlighted').trigger('click');
                }
                else {
                    if (jQuery.live_search.settings[instance].livesearch_result_only) {
                        jQuery(jQuery.live_search.settings[instance].input).removeAttr('data-q');
                        jQuery(jQuery.live_search.settings[instance].input).val('');
                    }
                    jQuery(jQuery.live_search.settings[instance].form).submit();
                }
            }
            if (evt.keyCode == 27) {
                jQuery(jQuery.live_search.settings[instance].live_box).css({'display': 'none'});
            }
            // Pfeil hoch abfangen
            if (evt.keyCode == 38) {
                evt.preventDefault();
                if (jQuery(jQuery.live_search.settings[instance].live_box + ' li.highlighted').length) {
                    before = jQuery(jQuery.live_search.settings[instance].live_box + ' li.highlighted').prev();
                    if (before.length) {
                        jQuery(jQuery.live_search.settings[instance].live_box + ' li.highlighted').removeClass('highlighted');
                        before.addClass('highlighted');
                    }
                }
            }
            // Pfeil runter abfangen
            if (evt.keyCode == 40) {
                evt.preventDefault();
                if (jQuery(jQuery.live_search.settings[instance].live_box + ' li.highlighted').length) {
                    next = jQuery(jQuery.live_search.settings[instance].live_box + ' li.highlighted').next();
                    if (next.length) {
                        jQuery(jQuery.live_search.settings[instance].live_box + ' li.highlighted').removeClass('highlighted');
                        next.addClass('highlighted');
                    }
                }
                else
                    jQuery(jQuery.live_search.settings[instance].live_box + ' li').first().addClass('highlighted');
            }
        });
        jQuery(jQuery.live_search.settings[instance]['submit']).click(function (evt) {
            evt.preventDefault();
            jQuery(jQuery.live_search.settings[instance]['live_box']).css({'display': 'none'});
        });

        if (jQuery.live_search.global.first_run) {
            jQuery(jQuery.live_search.settings[instance].form).submit(function (evt) {
                evt.preventDefault();
                //jQuery(jQuery.live_search.settings[instance].live_box).css({'display': 'none'});
                jQuery.live_search.settings[instance].after_submit();
            });
            jQuery.live_search.global.first_run = false;
        }
        jQuery(jQuery.live_search.settings[instance].form).submit(function (evt) {
            evt.preventDefault();
            jQuery(jQuery.live_search.settings[instance].live_box).css({'display': 'none'});
        });
    },
    show_results: function (instance, result) {
        result_html = '<ul style="margin: 5px 0; padding: 0; list-style: none;">';
        if (result.length) {
            jQuery(jQuery.live_search.settings[instance].live_box).css({'display': 'block'});
            for (i = 0; i < result.length; i++) {
                result_html += jQuery.live_search.settings[instance].process_result_line(result[i]);
            }
            result_html += '</ul>';
            jQuery(jQuery.live_search.settings[instance].live_box).html(result_html);
            jQuery(jQuery.live_search.settings[instance].live_box + ' li').click(function () {
                var search_string = jQuery(this).attr('data-q');
                var search_string_descr = jQuery(this).attr('data-q-descr');
                if (search_string_descr) {
                    jQuery(jQuery.live_search.settings[instance].input).val(search_string_descr);
                    jQuery(jQuery.live_search.settings[instance].input).attr({'data-q': search_string});
                }
                else {
                    jQuery(jQuery.live_search.settings[instance].input).val(search_string);
                }
                jQuery(jQuery.live_search.settings[instance].form).submit();
            });
        }
        else
            jQuery(jQuery.live_search.settings[instance].live_box).css({'display': 'none'});
    },
    resetTimer: function (timer) {
        if (timer)
            clearTimeout(timer)
    },
    process: function (instance) {
        var path = jQuery.live_search.settings[instance].url.split('?');
        if (jQuery(jQuery.live_search.settings[instance].input).val().length < 2) {
            jQuery.live_search.settings[instance].reset_data();
            return;
        }
        var params = {};
        params[jQuery.live_search.settings[instance].param] = jQuery(jQuery.live_search.settings[instance].input).val();

        params = jQuery.live_search.settings[instance].extend_params(params);
        jQuery.post(jQuery.live_search.settings[instance].url, params, function (data) {
            jQuery.live_search.show_results(instance, jQuery.live_search.settings[instance].select_data(data));
        });
    }
};

jQuery.fn.live_search = function (config) {
    this.each(function () {
        var instance = jQuery(this).attr('id');
        jQuery.live_search.settings[jQuery(this).attr('id')] = jQuery.extend(true, {}, jQuery.live_search.settings_template, config || {});
        jQuery.live_search.init(instance);
    });
    return this;
};