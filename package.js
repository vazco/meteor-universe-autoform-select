Package.describe({
    name: 'vazco:autoform-universe-select',
    summary: 'Custom "select" input type for AutoForm',
    version: '0.0.1',
    git: 'https://github.com/vazco/meteor-universe-autoform-select.git'
});

Package.onUse(function(api) {
    api.versionsFrom(['METEOR@1.0']);

    api.use(['underscore', 'templating', 'ui', 'blaze', 'reactive-var', 'reactive-dict'], 'client');

    api.use('aldeed:autoform');
    api.addFiles([
        'universe-autoform-select.html',
        'universe-autoform-select.js',
        'stylesheets/selectize.default.css',
    ], 'client');
});