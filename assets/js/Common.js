export default class Common {
    datepicker_options = {
        autoclose: true,
        format: 'dd.mm.yyyy',
        language: 'de',
        zIndexOffset: 10000
    };

    daterangepicker_locale = {
        format: 'DD.MM.YYYY',
        applyLabel: "wählen",
        cancelLabel: "abbrechen",
        customRangeLabel: 'Eigener Bereich',
        daysOfWeek: [
            "So",
            "Mo",
            "Di",
            "Mi",
            "Do",
            "Fr",
            "Sa"
        ],
        monthNames: [
            "Januar",
            "Februar",
            "März",
            "April",
            "mai",
            "Juni",
            "Juli",
            "August",
            "September",
            "Oktober",
            "November",
            "Dezember"
        ]
    };

    daterangepicker_ranges = {
       'heute': [moment(), moment()],
       'gestern': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
       'letzte 7 Tage': [moment().subtract(6, 'days'), moment()],
       'letzte 30 Tage': [moment().subtract(29, 'days'), moment()],
       'dieser Monat': [moment().startOf('month'), moment().endOf('month')],
       'letzter Monat': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
    };

    multiselect_options = {
        numberDisplayed: 0,
        includeSelectAllOption: true,
        allSelectedText: 'alles ausgewählt',
        nonSelectedText: 'bitte wählen',
        selectAllText: 'alles auswählen',
        nSelectedText: 'ausgewählt',
        buttonClass: 'form-control',
        buttonContainer: '<div class="btn-group bootstrap-multiselect" />'
    };


    constructor() {
        $('[data-toggle="popover"]').popover();
        $('#share a.wordpress').click(function (evt) {
            evt.preventDefault();
        });
        $(document).on('click', '[data-toggle="lightbox"]', function (e) {
            e.preventDefault();
            $(this).ekkoLightbox();
        });
    }

    formatDatetime(datetime, format) {
        let date = new Date(datetime + 'Z');
        date.setHours(date.getHours() - parseInt(date.getTimezoneOffset() / 60));
        datetime = date.toISOString();

        if (!format)
            format = 'full';

        let year = datetime.substr(0, 4);
        let month = datetime.substr(5, 2);
        let day = datetime.substr(8, 2);
        if (format === 'full') {
            let hour = datetime.substr(11, 2);
            let minute = datetime.substr(14, 2);
            return (day + '.' + month + '.' + year + ', ' + hour + ':' + minute + ' Uhr');
        }
        else if (format === 'date') {
             return (day + '.' + month + '.' + year);
        }
    }

    formatDate(date, format) {
        let year = date.substr(0, 4);
        let month = date.substr(5, 2);
        let day = date.substr(8, 2);
        return (day + '.' + month + '.' + year);
    }


};