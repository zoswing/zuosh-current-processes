/* jshint -W071 */
'use strict';

var os = require('os');

// 直接字符串方式截取，前提条件是只取5个值已经确定
const getValFromLine = line => {
    let cols = []
    let tmpStr = ''
    let i = 0
    while (i < line.length) {
        if (line[i] !== ' ') {
            tmpStr += line[i]
        } else {
            if (tmpStr)
                cols.push(tmpStr)
            tmpStr = ''
        }
        if (cols.length === 4) {
            break
        }
        i++
    }
    let nameStr = line.substring(i, line.length).trim()
    cols.push(nameStr)
    return cols
}

module.exports = function parserFixedColumns(data, cb) {

    var lines = _trimNewlines(data).split(os.EOL);
    var widths = _getColumnWidths(lines[0]);


    cb(null, lines
        .filter(function (line, index) {
            return line && index >= 1;
        })
        .map(function (line) {
            let cols = getValFromLine(line)

            let val = {
                pid: +cols[0],
                name: cols[4],
                cpu: +cols[3],
                pmem: parseInt(cols[1], 10) * 1024,
                vmem: parseInt(cols[2], 10) * 1024
            };
            return val
        }));
};

//
// Trims only newlines (no spaces) at the beginning and end of the string
//
function _trimNewlines(str) {
    return str.replace(/^[\r\n]+|[\r\n]+$/g, '');
}

//
// Grab column widths from first line
//
function _getColumnWidths(line) {

    var command = 'COMM';
    if (~line.indexOf('COMMAND')) {
        command = 'COMMAND';
    }

    return _inferColumnWidths([
        { query: 'PID', align: 'right' },
        { query: 'RSS', align: 'right' },
        { query: 'VSZ', align: 'right' },
        { query: '%CPU', align: 'right' },
        { query: command, align: 'left' }
    ], line);
}

//
// String helper for parsing a column-based text output
//
function _inferColumnWidths(columns, string) {

    var i, nextColumn;
    var len = columns.length;
    var last = len - 1;

    //
    // Pass 1: Start with header positions
    //
    for (i = 0; i < len; i++) {
        columns[i].pos = {
            index: i,
            start: string.indexOf(columns[i].query),
            length: columns[i].query.length
        };
    }

    //
    // Pass 2: Fix alignments
    //
    for (i = 0; i < len; i++) {

        // First column
        if (i === 0) {

            if (columns[i].align === 'left') {
                nextColumn = columns[i + 1].pos;
                columns[i].pos.length = (nextColumn.start - columns[i].pos.start);
            }

            else if (columns[i].align === 'right') {
                columns[i].pos.length += columns[i].pos.start;
            }

            else {
                throw 'StringHelper.inferColumnWidths `align` has incorrect value, valid options: left, right';
            }

            columns[i].pos.start = 0;
        }

        // Middle column
        else if (i < last) {

            if (columns[i].align === 'left') {
                nextColumn = columns[i + 1].pos;
                columns[i].pos.length = (nextColumn.start - columns[i].pos.start);
            }

            else if (columns[i].align === 'right') {

                var previousColumn = columns[i - 1].pos;
                var currentEndPosition = (columns[i].pos.start + columns[i].pos.length);
                var previousEndPosition = (previousColumn.start + previousColumn.length);

                columns[i].pos.length = currentEndPosition - previousEndPosition;
                columns[i].pos.start = previousEndPosition;
            }

            else {
                throw 'StringHelper.inferColumnWidths `align` has incorrect value, valid options: left, right';
            }
        }

        // Last column
        if (i === last) {
            columns[i].pos.length = undefined;
        }
    }

    //
    // Pass 3: Create getValue() methods

    //
    for (i = 0; i < len; i++) {
        columns[i].getValue = (function (i, pos) {
            // substr方式计算的不准确，start和length有问题
            // return function(str) {
            //     return String.prototype.substr.call(str, pos.start, pos.length).trim();
            // };
            // 直接截取
            return function (str) {
                return str.trim().replace(/\s+/g, ' ').split(" ")[i.index]
            }
        }(columns[i].pos));
    }

    return columns;
}
