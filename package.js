'use strict';

Package.describe({
    name: 'vazco:universe-autoform-select',
    summary: 'Custom "afUniverseSelect" input type for AutoForm, with the appearance as selectize',
    version: '0.0.4',
    git: 'https://github.com/vazco/meteor-universe-autoform-select.git'
});

Package.onUse(function(api) {
    api.use('templating@1.0.0');
    api.use('blaze@2.0.0');
    api.use('aldeed:autoform@4.0.0');
    //api.use('aldeed:autoform@4.0.0 || 5.0.0');

    api.use(['underscore@1.0.0', 'wizonesolutions:underscore-string@1.0.0', 'reactive-var@1.0.0'], 'client');




    api.addFiles([
        'universe-autoform-select.html',
        'universe-autoform-select.js',
        'stylesheets/selectize.default.css',
        'stylesheets/universe-autoform-select.css',
    ], 'client');
});