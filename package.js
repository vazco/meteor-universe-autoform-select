'use strict';

Package.describe({
    name: 'vazco:universe-autoform-select',
    summary: 'Custom "afUniverseSelect" input type for AutoForm, with the appearance as selectize',
    version: '0.3.2',
    git: 'https://github.com/vazco/meteor-universe-autoform-select.git'
});

Package.onUse(function (api) {
    api.versionsFrom('1.2.1');

    if (!api.addAssets) {
        api.addAssets = function (files, platform) {
            api.addFiles(files, platform, {isAsset: true});
        };
    }

    api.use('ecmascript');
    api.use('templating');
    api.use('aldeed:autoform');
    api.use('vazco:universe-selectize');

    api.use(['underscore', 'reactive-var'], 'client');

    api.addFiles('vendor/speakingurl.min.js', 'client');

    api.addFiles([
        'universe-autoform-select.html',
        'universe-autoform-select.js'
    ], 'client');

    api.addAssets('img/loading.gif', 'client');
});
