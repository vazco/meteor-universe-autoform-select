'use strict';

Package.describe({
    name: 'vazco:universe-autoform-select',
    summary: 'Custom "afUniverseSelect" input type for AutoForm, with the appearance as selectize',
    version: '0.1.2',
    git: 'https://github.com/vazco/meteor-universe-autoform-select.git'
});

Package.onUse(function(api) {
    api.versionsFrom('1.0.4.2');

    api.use('templating');
    api.use('aldeed:autoform@4.0.0 || 5.0.0');

    api.use(['underscore', 'wizonesolutions:underscore-string@1.0.0', 'reactive-var', 'less'], 'client');

    api.addFiles([
        'universe-autoform-select.html',
        'universe-autoform-select.js',
        'stylesheets/selectize.default.css',
        'stylesheets/universe-autoform-select.css'
    ], 'client');

    api.addFiles('img/loading.gif', ['client'], {isAsset: true});
});