import React from "react";
import ReactDOM from "react-dom";

export default class HomePaper {
    constructor() {
        $('#front-search-form').submit(function(evt) {
            evt.preventDefault();
            window.location.href = '/ratsdokumente/suche?text=' + encodeURIComponent($('#front-search-text').val());
        });

        let start = new Date(Date.now() - (70 * 24 * 60 * 60 * 1000));
        let end = new Date();
        let random_seed = '';
        let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (let i = 0; i < 16; i++) {
            random_seed += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        var params = {
            fq: {
                body: '_all',
                paperType: '_all'
            },
            rq: JSON.stringify({
                modified: {
                    gte: start.toISOString().substr(0, 19)
                }
            }),
            f: 0,
            s: 5,
            rs: random_seed
        };
        $.post('/api/search', params).then((data) => this.process_results(data));
    }

    process_results(data) {
        ReactDOM.render(this.renderList(data.data), document.getElementById('home-latest-documents'));
    }

    renderList(data) {
        let items = [];
        for (let i = 0; i < data.length; i++) {
            let descr = '';
            if (data[i].paperType)
                descr += data[i].paperType + ' ';
            else
                descr += 'Dokument ';
            if (data[i].created && data[i].modified) {
                if (data[i].created === data[i].modified)
                    descr += 'vom ' + window.common.formatDatetime(data[i].created, 'date');
                else
                    descr += ' verändert am ' + window.common.formatDatetime(data[i].modified, 'date');
            }
            descr += ' aus ' + data[i].body_name;
            items.push(
                <div>
                    <h4><a href={`/paper/${data[i].id}`}>{(data[i].name) ? data[i].name : 'Namenloses Dokument'}</a></h4>
                    <p>{descr}</p>
                </div>
            );
        }
        return (
            <div className="home-latest-document">
                {items}
            </div>
        )
    }
};