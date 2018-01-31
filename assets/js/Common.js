var Common = function () {
    this.init = function () {
        $('[data-toggle="popover"]').popover();
        $('#share a.wordpress').click(function (evt) {
            evt.preventDefault();
        });
        $(document).on('click', '[data-toggle="lightbox"]', function (e) {
            e.preventDefault();
            $(this).ekkoLightbox();
        });
    };


    this.format_datetime = function(datetime, format) {
        date = new Date(datetime + 'Z');
        date.setHours(date.getHours() - parseInt(date.getTimezoneOffset() / 60));
        datetime = date.toISOString();

        if (!format)
            format = 'full';

        year = datetime.substr(0, 4);
        month = datetime.substr(5, 2);
        day = datetime.substr(8, 2);
        if (format === 'full') {
            hour = datetime.substr(11, 2);
            minute = datetime.substr(14, 2);
            return (day + '.' + month + '.' + year + ', ' + hour + ':' + minute + ' Uhr');
        }
        else if (format === 'date') {
             return (day + '.' + month + '.' + year);
        }
    }
};