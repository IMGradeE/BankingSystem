class HTMLPages{
    navPills = {
        sectionOpener: '<div class="col-md-1"><ul class="nav flex-column nav-pills">',
        pump:'<li class="nav-item"> <a class="nav-link active" href=<%=navs[i].href%>><%=navs[i].linkTitle%></a>',
        sectionCloser:'</ul></div>'
    }
    tableHead = {
        sectionOpener: '<thead><tr>',
        pump: "<th><%=tableHeaders[i]%></th>" ,
        sectionCloser: '</thead></tr>'
    };

    tableEJS =
        '<div class="col-md-11">' +
                '<div class="tab-content">' +
                    '<div class="tab-pane active" id="panel-462431">' +
                        '<p>' +
                            '<!--TODO If pane has table' +
                            '(control flow for what content to render goes here)-->' +
                        '<!--TODO Static in pane item displaying current and available balances, as well as pending charges.-->' +
                        '<!--NOTE employee and admin initial screen can use the same UI but an admin will have a list of accounts requesting a password reset and the ability to approve them.-->' +
                        '<!--This feature for admins actually does not make sense because password resets can be done automatically with temporary passwords issued via a secure portal or other means. TODO ASK ABOUT THIS -->' +
                        '<!--This static item should also be on the transfers page, but instead of showing balance information, have the UI for initiating a transfer-->' +
                        '<!--NOTE Pending transactions should appear in the list first-->' +
                        '<!--TODO all tables need to have search bars-->' +
                        '<h3>' +
                            '<%=sections[0].tableTitle%>' +
                        '</h3>' +
                        '<table class="table table-sm table-bordered table-hover">' +
                            '<thead>' +
                            '<tr>' +
                                '<!--TODO dynamically generate the correct number of th elements, populate accordingly-->' +
                                '<th>' +
                                    '#' +
                                '</th>' +
                                '<th>' +
                                    'Product' +
                                '</th>' +
                                '<th>' +
                                    'Payment Taken' +
                                '</th>' +
                                '<th>' +
                                    'Status' +
                                '</th>' +
                            '</tr>' +
                            '</thead>' +
                            '<tbody>' +
                            '<!--TODO dynamically insert content from database into rows-->' +
                            '<tr>' +
                                '<td>' +
                                    '1' +
                                '</td>' +
                                '<td>' +
                                    'TB - Monthly' +
                                '</td>' +
                                '<td>' +
                                    '01/04/2012' +
                                '</td>' +
                                '<td>' +
                                    'Default' +
                                '</td>' +
                            '</tr>' +
                            '<tr class="table-active">' +
                                '<td>' +
                                    '1' +
                                '</td>' +
                                '<td>' +
                                    'TB - Monthly' +
                                '</td>' +
                                '<td>' +
                                    '01/04/2012' +
                                '</td>' +
                                '<td>' +
                                    'Approved' +
                                '</td>' +
                            '</tr>' +
                            '<tr class="table-success">' +
                                '<td>' +
                                    '2' +
                                '</td>' +
                                '<td>' +
                                    'TB - Monthly' +
                                '</td>' +
                                '<td>' +
                                    '02/04/2012' +
                                '</td>' +
                                '<td>' +
                                    'Declined' +
                                '</td>' +
                            '</tr>' +
                            '<tr class="table-warning">' +
                                '<td>' +
                                    '3' +
                                '</td>' +
                                '<td>' +
                                    'TB - Monthly' +
                                '</td>' +
                                '<td>' +
                                    '03/04/2012' +
                                '</td>' +
                                '<td>' +
                                    'Pending' +
                                '</td>' +
                            '</tr>' +
                            '<tr class="table-danger">' +
                                '<td>' +
                                    '4' +
                                '</td>' +
                                '<td>' +
                                    'TB - Monthly' +
                                '</td>' +
                                '<td>' +
                                    '04/04/2012' +
                                '</td>' +
                                '<td>' +
                                    'Call in to confirm' +
                                '</td>' +
                            '</tr>' +
                            '</tbody>' +
                        '</table>' +
                        '<nav class="pagination-sm">' +
                            '<ul class="pagination">' +
                                '<!--TODO the number of pages available needs to be totalEntries/n + 1 if totalEntries%n != 0, with a max of 9 clickable indices and ellipsis before the last clickable location which is the maximum.-->' +
                                '<li class="page-item">' +
                                    '<a class="page-link" href="<!--TODO get the text of this element as num * n entries and redraw table-->">Previous</a>' +
                                '</li>' +
                                '<li class="page-item">' +
                                    '<a class="page-link" href="<!--TODO get the text of this element as num * n entries and redraw table-->">1</a>' +
                                '</li>' +
                                '<li class="page-item">' +
                                    '<a class="page-link" href="<!--TODO get the text of this element as num, [num-1 * n, ((num-1)*n)+n] entries and redraw table-->">2</a>' +
                                '</li>' +
                                '<li class="page-item">' +
                                    '<a class="page-link" href="<!--TODO get the text of this element as num, [num-1 * n, ((num-1)*n)+n] entries and redraw table-->">3</a>' +
                                '</li>' +
                                '<li class="page-item">' +
                                    '<a class="page-link" href="<!--TODO get the text of this element as num, [num-1 * n, ((num-1)*n)+n] entries and redraw table-->">4</a>' +
                                '</li>' +
                                '<li class="page-item">' +
                                    '<a class="page-link" href="<!--TODO get the text of this element as num, [num-1 * n, ((num-1)*n)+n] entries and redraw table-->">5</a>' +
                                '</li>' +
                                '<li class="page-item">' +
                                    '<a class="page-link" href="<!--TODO get n entries past the current last entry and redraw table-->">Next</a>' +
                                '</li>' +
                            '</ul>' +
                        '</nav>' +
                        '</p>' +
                    '</div>' +
                    '<div class="tab-pane" id="tab2">' +
                        '<p>' +
                            'Howdy, I\'m in Section 2.' +
                        '</p>' +
                    '</div>' +
            '</div>' +
        '</div>';
}

class AdminBasePage extends HTMLPages{
    constructor() {
        super();
    }
    render(){
        // do not render tables or nav-pills
    }
}
class userBasePage extends HTMLPages{
    constructor() {
        super();
    }
    // nav-pills:

    render(){


    }
}