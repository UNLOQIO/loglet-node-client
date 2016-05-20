# Loglet.io

Loglet.io node.js client for encrypted log streaming and storage.

Introduction
------------

The Loglet.io project uses UNLOQ.io personal encryption keys to generate shared
secret keys, used to perform end-to-end encryption (above TLS) from your node.js apps
to your browser. In this scenario, the loglet.io servers are working in zero-knowledge state.

Getting Started
---------------

#### Account creation:
Go to https://loglet.io, login with UNLOQ and create an application

#### Installation:

    npm install loglet.io

#### Usage:

    var loglet = require('loglet.io');
    loglet({
        key: 'YOUR_APP_KEY',
        secret: 'YOUR_APP_SECRET'
    });
    /**
     * The log item can contain the following properties:
     *  - name[=default] - the name of the logger or app instance
     *  - namespace[=global] - the namespace of the log event
     *  - level[=debug] - the log level. Values are: trace, debug, info, warn, error, fatal
     *  - message (required) - the message that we want to send.
     *  - data - additional data that can be attached to the log entry as a an object, array, string or number
     *  - tags - additional tags that can be attached to the log entry. Each tag entry must be a string.
     *  - error - additional error information. If we receive an error object, we will also include its stack trace.
     * */
    loglet.send({
        level: 'trace',
        message: 'Hello world!'
    })
    