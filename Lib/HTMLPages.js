class HTMLPages{
    navPills = {
        sectionOpener: '<div class="col-md-1"><ul class="nav flex-column nav-pills">',
        pump:'<li class="nav-item"> <a class="nav-link active" href=<%=navs[i].href%>><%=navs[i].linkTitle%></a>',
        sectionCloser:'</ul></div>'
    }

    table = {
        sectionOpener: '<table class="table table-borderless">',
        tableHead : {
            sectionOpener: '<thead><tr>',
            pump: "<th><%=tableHeaders[column]%></th>",
            sectionCloser: '</thead></tr>'
        },
        tableBody : {
            sectionOpener: '<tbody>',
            pump: {
                sectionOpener: '<tr>',
                pump: '<td><%=queryResults[column][row]%></td>',
                closer: '</tr>',
            },
            sectionCloser: '</tbody>'
        },
        sectionCloser: '</table>'
    }
    // if size of resultset > size of max entries, pump
    // TODO the number of pages available needs to be totalEntries/n + 1 if totalEntries%n != 0, with a max of 9 clickable indices and ellipsis before the last clickable location which is the maximum.
    pagination = {
        sectionOpener:
            '<nav class="pagination-sm">' +
            ' <ul class="pagination"> ' +
            '<li class="page-item"> ' +
            '<a class="page-link" href="<!--TODO get n entries past the current last entry and redraw table-->">Prev</a> ' +
            '</li>',
        pump:
            '<li class="page-item">' +
            '<a class="page-link" href="<!--TODO get the text of this element as num * n entries and redraw table-->"><%=page%></a>' +
            '</li>',
        sectionCloser: '<li className="page-item"> <a className="page-link" href="<!--TODO get the text of this element as num * n entries and redraw table-->">Next</a> </li>'
    }

}

class AdminBasePage extends HTMLPages {
    constructor() {
        super();
    }

    render() {
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