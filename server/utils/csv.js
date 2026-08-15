/*
 * Minimal RFC 4180 parser. Written by hand rather than pulled from npm because the format is
 * small and the only tricky parts — quoted fields holding commas or newlines, and the ""
 * escape — are exactly what a naive text.split(',') gets wrong on real place names.
 */
export function parseCsv(text) {
    // spreadsheets prepend a BOM, which would end up glued to the first header name
    const input = text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;

    const rows = [];
    let row = [];
    let field = '';
    let inQuotes = false;
    let i = 0;

    while(i < input.length) {
        const char = input[i];

        if(inQuotes) {
            if(char === '"') {
                // a doubled quote inside a quoted field is a literal quote
                if(input[i + 1] === '"') {
                    field += '"';
                    i += 2;
                    continue;
                }
                inQuotes = false;
                i++;
                continue;
            }
            field += char;
            i++;
            continue;
        }

        if(char === '"') { inQuotes = true; i++; continue; }
        if(char === ',') { row.push(field); field = ''; i++; continue; }
        if(char === '\r') { i++; continue; }

        if(char === '\n') {
            row.push(field);
            rows.push(row);
            row = [];
            field = '';
            i++;
            continue;
        }

        field += char;
        i++;
    }

    // whatever is still buffered when the input ends closes the final row
    if(field !== '' || row.length) {
        row.push(field);
        rows.push(row);
    }

    return rows;
}

/*
 * Turns the first row into keys and every later row into an object. Header names are
 * normalised, so "Country Name", "country_name" and "countryName" all arrive as countryname.
 * Each record carries __line, the 1 based line in the file, for error reporting.
 */
export function parseCsvToObjects(text) {
    const rows = parseCsv(text).filter(cells => cells.some(cell => cell.trim() !== ''));

    if(!rows.length) return { headers: [], records: [] };

    const headers = rows[0].map(header => header.trim().toLowerCase().replace(/[\s_-]+/g, ''));

    const records = rows.slice(1).map((cells, index) => {
        const record = { __line: index + 2 };
        headers.forEach((header, column) => {
            record[header] = (cells[column] ?? '').trim();
        });
        return record;
    });

    return { headers, records };
}
