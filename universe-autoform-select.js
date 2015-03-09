'use strict';

AutoForm.addInputType("universe-select", {
    template: "afUniverseSelect",
    valueIsArray: true,
    valueOut: function () {
        return this.val();
    },
    contextAdjust: function (context) {
        // build items list
        context.items = _.map(context.selectOptions, function(opt) {
            return {
                label: opt.label,
                value: opt.value,
                selected: _.contains(context.value, opt.value)
            };
        });

        if(context.atts.multiple){
            context.atts.multipleClass = "multi";
            context.atts.remove_button = "plugin-remove_button";
        }else{
            context.atts.multiple = undefined;
            context.atts.multipleClass = "single";
            context.atts.remove_button = "";
        }

        return context;
    }
});

Template.afUniverseSelect.created = function () {
    var template = this;
    template.vazcoSelect = {};
    template.vazcoSelect.items = new ReactiveVar();
    template.vazcoSelect.values = new ReactiveVar();
}

Template.afUniverseSelect.rendered = function () {
    var template = this;

    template.autorun(function () {
        var data = Template.currentData();
        var values = [];
        var el = $(template.find('select'));

        _.each(data.items, function (item) {
            item.visible = true;
            if (item.selected) {
                values.push(item.value);
            }
        });

        template.vazcoSelect.values.set(values);
        template.vazcoSelect.items.set(data.items);
    });

    template.autorun(function () {
        var values = template.vazcoSelect.values.get();
        var input = $(template.find('select'));

        if (!_.isEqual(input.val(), values)) {
            input.val(values);
        }
    });
};


Template.afUniverseSelect.helpers({
    optionAtts: function afSelectOptionAtts() {
        var item = this;
        var atts = {
            value: item.value
        };

        return atts;
    },
    getItemsSelected: function () {
        var template = Template.instance();
        var items = [];
        if(template.vazcoSelect){
            _.each(template.vazcoSelect.items.get(), function (item) {
                if(item.selected){
                    items.push(item);
                }
            });
        }
        return items;
    },
    getItemsUnselected: function () {
        var template = Template.instance();
        var items = [];
        if(template.vazcoSelect){
            _.each(template.vazcoSelect.items.get(), function (item) {
                if(!item.selected && item.visible){
                    items.push(item);
                }
            });
        }
        return items;
    }
});

Template.afUniverseSelect.events({
    'click .remove': function (e, template) {
        var el = $(e.target);
        var val = el.parent().attr('data-value');
        var values = template.vazcoSelect.values.get();

        values = _.without(values, val);
        _saveValues(template, values);
    },
    'click .selectize-dropdown-content > div': function (e, template) {
        var el = $(e.target);
        var val = el.attr('data-value');
        var values = template.vazcoSelect.values.get();

        if(template.data.atts.multiple){
            values = _.union(values, val);
        }else{
            values = val;
        }

        _saveValues(template, values);

        if(template.data.atts.multiple) {
            $(template.find('.js-selectize-dropdown')).stop();
            $(template.find('input')).focus();
        }else{
            $(template.find('.js-selectize-dropdown')).stop().hide();
        }
    },
    'click .selectize-input': function (e, template) {
        $(template.find('input')).focus();
    },
    'keydown input': function (e, template) {
        var el = $(e.target);
        var values = template.vazcoSelect.values.get();
        var width = _measureString(el.val(), el) + 10;
        el.width(width);

        switch (e.keyCode) {
            case 8:
                if(el.val() === '') {
                    values.pop();
                    _saveValues(template, values);
                }
                break;
        }
    },
    'keyup input': function (e, template) {
        var el = $(e.target);
        var value = el.val();
        var items = template.vazcoSelect.items.get();

        if(value){
            $(template.find('.create')).show();
            $(template.find('.create strong')).text(value);
        }else{
            $(template.find('.create')).hide();
        }

        _.each(items, function (item, key) {
            if(item.label.search(new RegExp(value,"i")) !== -1){
                items[key].visible = true;
            }else{
                items[key].visible = false;
            }
        });

        template.vazcoSelect.items.set(items);

    },
    'focus input': function (e, template) {
        $(template.find('.js-selectize-dropdown')).stop().show();
    },
    'blur input': function (e, template) {
        $(template.find('.js-selectize-dropdown')).hide(500);
    },
    'click .create': function (e, template) {
        var el = $(e.target);
        var $input = $(template.find('input'));
        $input.val('');
        $(template.find('.create')).hide();
    }
});



var _saveValues = function (template, values) {
    var input = $(template.find('select'));
    template.vazcoSelect.values.set(values);

    if (!_.isEqual(input.val(), values)) {
        input.val(values).change();
    }
}




// from selectize utils https://github.com/brianreavis/selectize.js/blob/master/src/utils.js

var _measureString = function(str, $parent) {
    if (!str) {
        return 0;
    }

    var $test = $('<test>').css({
        position: 'absolute',
        top: -99999,
        left: -99999,
        width: 'auto',
        padding: 0,
        whiteSpace: 'pre'
    }).text(str).appendTo('body');

    _transferStyles($parent, $test, [
        'letterSpacing',
        'fontSize',
        'fontFamily',
        'fontWeight',
        'textTransform'
    ]);

    var width = $test.width();
    $test.remove();

    return width;
};

var _transferStyles = function($from, $to, properties) {
    var i, n, styles = {};
    if (properties) {
        for (i = 0, n = properties.length; i < n; i++) {
            styles[properties[i]] = $from.css(properties[i]);
        }
    } else {
        styles = $from.css();
    }
    $to.css(styles);
};
