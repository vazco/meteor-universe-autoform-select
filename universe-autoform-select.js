'use strict';

AutoForm.addInputType('universe-select', {
    template: 'afUniverseSelect',
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

        if(context.atts.remove_button === false){
            context.atts.remove_button = '';
        } else {
            context.atts.remove_button = 'plugin-remove_button';
        }

        if(context.atts.multiple){
            context.atts.multipleClass = 'multi';
        }else{
            context.atts.multiple = undefined;
            context.atts.multipleClass = 'single';
            context.atts.remove_button = '';
        }

        // get autosave value
        var i=0;
        while(Template.parentData(i) && !Template.parentData(i)._af){
            i++;
        }
        if(Template.parentData(i) && Template.parentData(i)._af){
            context.autosave = Template.parentData(i)._af.autosave;
        } else {
            console.log('autosave is undefined -- fixme');
            context.autosave = true;
        }

        return context;
    }
});

Template.afUniverseSelect.created = function () {
    var template = this;
    template.universeSelect = {};
    template.universeSelect.items = new ReactiveVar();
    template.universeSelect.values = new ReactiveVar();
    template.universeSelect.reactive = new ReactiveVar(true);
};

Template.afUniverseSelect.rendered = function () {
    var template = this, prevVal;

    template.autorun(function () {
        var data = Template.currentData();
        var values = [];

        _.each(data.items, function (item) {
            item.visible = true;
            if (item.selected) {
                values.push(item.value);
            }
        });


        // fix for non-reactive value if autosave is false
        if(template.universeSelect.reactive.get() &&
           (template.data.autosave || (prevVal === undefined || prevVal.length === 0))) {
                template.universeSelect.values.set(values);
                template.universeSelect.items.set(data.items);
                prevVal = values;
        }
    });

    template.autorun(function () {
        var values = template.universeSelect.values.get();
        var $select = $(template.find('select'));

        if (!_.isEqual($select.val(), values)) {
            $select.val(values);
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
    getItems: function () {
        var template = Template.instance();
        var items = template.universeSelect.items.get();

        return items;
    },
    getItemsSelected: function () {
        var template = Template.instance();
        var selectItems = template.universeSelect.items.get();
        var items = [];

        _.each(selectItems, function (item) {
            if (item.selected) {
                items.push(item);
            }
        });

        return items;
    },
    getItemsUnselected: function () {
        var template = Template.instance();
        var items = [];

        _.each(template.universeSelect.items.get(), function (item) {
            if(!item.selected && item.visible){
                items.push(item);
            }
        });

        Meteor.defer(function () {
            _universeSelectOnChangedItems(template);
        });

        return items;
    }
});

Template.afUniverseSelect.events({
    'click .remove': function (e, template) {
        e.preventDefault();
        var el = $(e.target);
        var val = el.parent().attr('data-value');
        var values = template.universeSelect.values.get();

        values = _.without(values, val);
        _saveValues(template, values);
    },
    'click .selectize-dropdown-content > div:not(.create)': function (e, template) {
        e.preventDefault();
        var el = $(e.target);
        var val = el.attr('data-value');
        var values = template.universeSelect.values.get();

        if(template.data.atts.multiple){
            values = _.union(values, val);
        }else{
            values = val;
        }

        _saveValues(template, values);

        if(template.data.atts.multiple) {
            $(template.find('.js-selectize-dropdown')).stop(true, true).show();
            $(template.find('input')).focus();
        }else{
            $(template.find('.js-selectize-dropdown')).stop(true, true).hide();
        }
    },
    'click .selectize-input': function (e, template) {
        $(template.find('input')).focus();
    },
    'keydown input': function (e, template) {
        var el = $(e.target);
        var values = template.universeSelect.values.get();
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
        var items = template.universeSelect.items.get();

        if(value){
            $(template.find('.create')).show();
            $(template.find('.create strong')).text(value);
        }else{
            $(template.find('.create')).hide();
        }

        _.each(items, function (item, key) {
            if(item.label.search(new RegExp(value,'i')) !== -1){
                items[key].visible = true;
            }else{
                items[key].visible = false;
            }
        });

        template.universeSelect.items.set(items);

    },
    'focus input': function (e, template) {
        _universeSelectOnFocus(e, template);
    },
    'blur input': function (e, template) {
        _universeSelectOnBlur(e, template);
    },
    'click .create': function (e, template) {
        var $input = $(template.find('input'));
        var items = template.universeSelect.items.get();
        var values = template.universeSelect.values.get();
        var val = $input.val();

        template.universeSelect.reactive.set(false);

        if(_.indexOf(values, val) === -1) {
            items.push({
                label: val,
                value: val,
                selected: true,
                visible: false
            });
            template.universeSelect.items.set(items);

            if (template.data.atts.createMethod) {
                Meteor.call(template.data.atts.createMethod, val, val, function () {
                    _saveCreatedItem();
                });
            } else {
                _saveCreatedItem();
            }
        }

        var _saveCreatedItem = function () {
            if (template.data.atts.multiple) {
                values = _.union(values, val);
            } else {
                values = val;
            }

            _saveValues(template, values);
        };

        $input.val('');
        $(template.find('.create')).hide();
        _universeSelectOnBlur(e, template);
    }
});

var _universeSelectOnFocus = function (e, template) {
    $(template.find('.js-selectize-dropdown')).stop(true, true).show();
    $(template.find('.selectize-input')).addClass('focus input-active dropdown-active');
    _universeSelectOnChangedItems(template);
}

var _universeSelectOnBlur = function (e, template) {
    $(template.find('.js-selectize-dropdown')).stop(true, true).hide(500);
    $(template.find('.selectize-input')).removeClass('focus input-active dropdown-active');
}

var _universeSelectOnChangedItems = function (template) {
    var height = $(template.find('.selectize-dropdown-content')).height();
    $(template.find('.selectize-dropdown')).height(height);
}


var _saveValues = function (template, values) {
    var $select = $(template.find('select'));
    var items = template.universeSelect.items.get();

    _.each(items, function (item, key) {
        if(_.indexOf(values, item.value) !== -1){
            items[key].selected = true;
        }else{
            items[key].selected = false;
        }
    });

    template.universeSelect.items.set(items);
    template.universeSelect.values.set(values);

    if (!_.isEqual($select.val(), values)) {
        $select.val(values).change();
    }
};




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
