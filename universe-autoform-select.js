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

        // remove_button option
        if(context.atts.remove_button === false){
            context.atts.remove_button = '';
        } else {
            context.atts.remove_button = 'plugin-remove_button';
        }

        // multiple option
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
    template.universeSelect.blurTimeoutId = new ReactiveVar();
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
        }
    });

    template.autorun(function () {
        var values = template.universeSelect.values.get();
        var $select = $(template.find('select'));

        if (!_.isEqual($select.val(), values)) {
            $select.val(values);
        }

        prevVal = values;
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

        // Height adjustment after adding items to the template
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

        $(template.find('input')).val('');

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
        var $input = $(template.find('input'));
        var $unselectedItems = $(template.findAll('.selectize-dropdown-content > div:not(.create)'));
        var $createItem = $(template.find('.selectize-dropdown-content > div.create'));
        el.width(width);

        switch (e.keyCode) {
            case 8: // backspace
                if(el.val() === '') {
                    values.pop();
                    _saveValues(template, values);
                }
                break;

            case 27: // escape
                $input.blur();
                break;

            case 13: // enter
                e.preventDefault();
                if($input.val() === ''){
                    break;
                }

                if($unselectedItems.length === 1) {
                    $unselectedItems.first().trigger('click');
                    $input.val('');
                } else if (template.data.atts.create) {
                    $createItem.trigger('click');
                    $input.val('');
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
        var timeoutId = template.universeSelect.blurTimeoutId.get();
        if (timeoutId) {
            Meteor.clearTimeout(timeoutId);
        }

        _universeSelectOnFocus(e, template);
    },
    'blur input': function (e, template) {
        var timeoutId = Meteor.setTimeout(function () {
            _universeSelectOnBlur(e, template);
        }, 500);
        template.universeSelect.blurTimeoutId.set(timeoutId);
    },
    'click .create': function (e, template) {
        var $input = $(template.find('input'));
        var items = template.universeSelect.items.get();
        var values = template.universeSelect.values.get();
        var label = $input.val();
        var value = _.str.slugify(label);

        template.universeSelect.reactive.set(false);

        if(_.indexOf(values, value) === -1) {
            items.push({
                label: label,
                value: value,
                selected: true,
                visible: false
            });
            template.universeSelect.items.set(items);

            if (template.data.atts.createMethod) {
                Meteor.call(template.data.atts.createMethod, label, value, function () {
                    _saveCreatedItem();
                });
            } else {
                _saveCreatedItem();
            }
        }

        var _saveCreatedItem = function () {
            if (template.data.atts.multiple) {
                values = _.union(values, value);
            } else {
                values = value;
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
};

var _universeSelectOnBlur = function (e, template) {
    var $select = $(template.find('select'));
    var $selectizeInput = $(template.find('.selectize-input'));
    var $selectizeDropdown =  $(template.find('.js-selectize-dropdown'));


    $select.change(); //save value on blur

    $selectizeDropdown.stop(true, true).hide(500);
    $selectizeInput.removeClass('focus input-active dropdown-active');
};

var _universeSelectOnChangedItems = function (template) {
    var heightDropdown = $(template.find('.selectize-dropdown-content')).outerHeight();
    var heightInput = $(template.find('.selectize-input')).outerHeight();

    $(template.find('.selectize-dropdown')).css({
        height: heightDropdown,
        top: heightInput
    });
};


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
        $select.val(values);
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
