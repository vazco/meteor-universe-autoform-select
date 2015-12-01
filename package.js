'use strict';

Package.describe({
    name: 'vazco:universe-autoform-select',
    summary: 'Custom "afUniverseSelect" input type for AutoForm, with the appearance as selectize',
    version: '0.1.16',
    git: 'https://github.com/vazco/meteor-universe-autoform-select.git'
});

Package.onUse(function(api) {
    api.versionsFrom('1.0.4.3');

    if(!api.addAssets) {
        api.addAssets = function(files, platform){
            api.addFiles(files, platform, {isAsset: true})
        };
    }

    api.use('templating');
    api.use('aldeed:autoform@4.0.0 || 5.0.0');

    api.use(['underscore', 'reactive-var'], 'client');

    api.addFiles('vendor/speakingurl.min.js', 'client');

    api.addFiles([
        'universe-autoform-select.html',
        'universe-autoform-select.js',
        'stylesheets/selectize.default.css',
        'stylesheets/universe-autoform-select.css'
    ], 'client');

    api.addAssets('img/loading.gif', 'client');
});
