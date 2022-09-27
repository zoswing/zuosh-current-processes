'use strict';

var exec = require('child_process').exec;
var iconv = require('iconv-lite');
var encoding = 'cp936';
var binaryEncoding = 'binary';

module.exports = function dataSourceWMIC(cb) {

    var cols = 'IDProcess,Name,PercentProcessorTime,PrivateBytes,VirtualBytes';
    var cmd = 'wmic path Win32_PerfFormattedData_PerfProc_Process get ' + cols + ' /format:csv';


    exec(cmd, { encoding: binaryEncoding }, function (err, stdout, stderr) {
        if (err) {
            cb('Command `wmic` returned an error!');
        } else {
            let output = iconv.decode(Buffer.from(stdout, binaryEncoding), encoding)
            cb(null, output);
        }
    });
};