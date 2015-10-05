'use strict';

AutoForm.addInputType('universe-select', {
    template: 'afUniverseSelect',
    valueIsArray: true,
    valueOut: function () {
        return this.val();
    },
    contextAdjust: function (context) {
        // build items list

        context.items = _.map(context.selectOptions, function (opt) {
            return {
                label: opt.label,
                value: opt.value,
                selected: _.contains(context.value, opt.value)
            };
        });

        // remove_button option
        if (context.atts.remove_button === false) {
            context.atts.remove_button = '';
        } else {
            context.atts.remove_button = 'plugin-remove_button';
        }

        // multiple option
        if (context.atts.multiple) {
            context.atts.multipleClass = 'multi';
        } else {
            context.atts.multiple = undefined;
            context.atts.multipleClass = 'single';
            context.atts.remove_button = '';
        }

        if (context.atts.createSlug !== false) {
            context.atts.createSlug = true;
        }

        //autosave option
        context.atts.autosave = AutoForm.getCurrentDataForForm().autosave || false;
        context.atts.placeholder = AutoForm.getCurrentDataForForm().placeholder || context.atts.uniPlaceholder || null;
        context.atts.uniDisabled = !!AutoForm.getCurrentDataForForm().disabled || false;

        return context;
    }
});

Template.afUniverseSelect.onCreated(function () {
    var template = this;

    template.universeSelect = {};
    template.universeSelect.items = new ReactiveVar();
    template.universeSelect.values = new ReactiveVar();
    template.universeSelect.reactive = new ReactiveVar(true);
    template.universeSelect.blurTimeoutId = new ReactiveVar();
    template.universeSelect.loading = new ReactiveVar(false);
});

Template.afUniverseSelect.onRendered(function () {
    var template = this;
    var prevVal;
    var optionsMethod = template.data.atts.optionsMethod;

    if (optionsMethod) {
        template.autorun(function () {
            var data = Template.currentData();

            _getOptionsFromMethod(null, data.value, template);
        });
    } else {
        template.autorun(function () {
            var data = Template.currentData();

            _.each(data.items, function (item) {
                item.visible = true;
            });

            if (template.universeSelect.reactive.get()/* && data.atts.autosave*/) {
                template.universeSelect.items.set(data.items);
            }
        });
    }

    template.autorun(function () {
        var items = template.universeSelect.items.get();
        var values = [];
        var values_limit = template.data.atts.values_limit;

        _.each(items, function (item) {
            if (item.selected) {
                values.push(item.value);
            }
        });

        if (values_limit !== undefined && values.length > values_limit) {
            var values_old = template.universeSelect.values.get();
            _.each(items, function (item) {
                if (!_.contains(values_old, item.value)) {
                    item.selected = false;
                }
            });
            template.universeSelect.items.set(items);
            return;
        }

        template.universeSelect.values.set(values);
    });

    template.autorun(function () {
        var values = template.universeSelect.values.get();
        var $select = $(template.find('select'));

        if (!_.isEqual($select.val(), values)) {
            Meteor.setTimeout(function() {
                $select.val(values);
            }, 0);
        }

        prevVal = values;
    });
});


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
            if (!item.selected && item.visible) {
                items.push(item);
            }
        });

        // Height adjustment after adding items to the template
        Meteor.defer(function () {
            _universeSelectOnChangedItems(template);
        });

        return items;
    },
    isLoading: function () {
        var template = Template.instance();
        return template.universeSelect.loading.get();
    },
    getPlaceholder: function () {
        return this.atts.placeholder;
    },
    isDisabled: function () {
        return this.atts.uniDisabled;
    }
});

var _checkDisabled = function (template) {
    if (template.data.atts.uniDisabled) {
        throw new Meteor.Error('This field is disabled');
    }
};

Template.afUniverseSelect.events({
    'click .remove': function (e, template) {
        e.preventDefault();
        _checkDisabled(template);

        var $el = $(e.target);
        var val = $el.parent().attr('data-value');
        var values = template.universeSelect.values.get();

        values = _.without(values, val);

        _saveValues(template, values);
    },
    'click .selectize-dropdown-content > div:not(.create)': function (e, template) {
        e.preventDefault();
        _checkDisabled(template);

        var $el = $(e.target);
        var val = $el.attr('data-value');
        var values = template.universeSelect.values.get();

        if (template.data.atts.multiple) {
            values = _.union(values, val);
        } else {
            values = val;
        }

        _saveValues(template, values);

        $(template.find('input')).val('');
        _setVisibleByValue('', template);

        if (template.data.atts.multiple) {
            $(template.find('.js-selectize-dropdown')).stop(true, true).show();
            $(template.find('input')).focus();
        } else {
            $(template.find('.js-selectize-dropdown')).stop(true, true).hide();
        }
    },
    'click .selectize-input': function (e, template) {
        _checkDisabled(template);

        var $input = $(template.find('input'));
        $input.focus();

        _getOptionsFromMethod($input.val(), null, template);
    },
    'keydown input': function (e, template) {
        _checkDisabled(template);

        var $el = $(e.target);
        var values = template.universeSelect.values.get();
        var width = _measureString($el.val(), $el) + 10;
        var $input = $(template.find('input'));
        var $unselectedItems = $(template.findAll('.selectize-dropdown-content > div:not(.create)'));
        var $createItem = $(template.find('.selectize-dropdown-content > div.create'));

        $el.width(width);

        switch (e.keyCode) {
            case 8: // backspace
                if ($el.val() === '') {
                    values.pop();
                    _saveValues(template, values);
                }

                break;

            case 27: // escape
                $input.blur();
                break;

            case 13: // enter
                e.preventDefault();

                if ($input.val() === '') {
                    break;
                }

                if ($unselectedItems.length === 1) {
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
        _checkDisabled(template);

        var $el = $(e.target);
        var value = $el.val();


        if (value) {
            $(template.find('.create')).show();
            $(template.find('.create strong')).text(value);
        } else {
            $(template.find('.create')).hide();
        }

        _setVisibleByValue(value, template);

        _getOptionsFromMethod(value, null, template);
    },
    'focus input': function (e, template) {
        _checkDisabled(template);

        var timeoutId = template.universeSelect.blurTimeoutId.get();

        if (timeoutId) {
            Meteor.clearTimeout(timeoutId);
        }

        _universeSelectOnFocus(template);
    },
    'change input': function(e, template) {
        _checkDisabled(template);

        // prevent non-autoform fields changes from submitting the form when autosave is enabled
        e.preventDefault();
        e.stopPropagation();
    },
    'blur input': function (e, template) {
        _checkDisabled(template);

        var timeoutId = Meteor.setTimeout(function () {
            _universeSelectOnBlur(e, template);
        }, 500);

        template.universeSelect.blurTimeoutId.set(timeoutId);
    },
    'click .create': function (e, template) {
        _checkDisabled(template);

        var $input = $(template.find('input'));
        var items = template.universeSelect.items.get();
        var values = template.universeSelect.values.get();
        var label = $input.val();
        var value = label;

        if (template.data.atts.createSlug) {
            value = getSlug(value);
        }

        template.universeSelect.reactive.set(false);

        var _saveCreatedItem = function () {
            if (template.data.atts.multiple) {
                values = _.union(values, value);
            } else {
                values = value;
            }

            _saveValues(template, values);
        };

        if (_.indexOf(values, value) === -1) {
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

        $input.val('');
        $(template.find('.create')).hide();

        // We don't have to call _universeSelectOnBlur because 'blur input' is also triggered
        //_universeSelectOnBlur(e, template);
    }
});

var _universeSelectOnFocus = function (template) {
    $(template.find('.js-selectize-dropdown')).stop(true, true).show();
    $(template.find('.selectize-input')).addClass('focus input-active dropdown-active');
    _universeSelectOnChangedItems(template);
};

var _universeSelectOnBlur = function (e, template) {
    var $select = $(template.find('select'));
    var $selectizeInput = $(template.find('.selectize-input'));
    var $selectizeDropdown = $(template.find('.js-selectize-dropdown'));
    var values = template.universeSelect.values.get();
    $select.val(values);
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
    var items = template.universeSelect.items.get();

    if (!_.isArray(values)) {
        values = [values];
    }

    _.each(items, function (item, key) {
        if (_.indexOf(values, item.value.toString()) !== -1) {
            item.selected = true;
        } else {
            item.selected = false;
        }
    });

    template.universeSelect.items.set(items);
};

// from selectize utils https://github.com/brianreavis/selectize.js/blob/master/src/utils.js

var _measureString = function (str, $parent) {
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

var _transferStyles = function ($from, $to, properties) {
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

var _setVisibleByValue = function (value, template) {
    var items = template.universeSelect.items.get();

    _.each(items, function (item) {
        if (item.label.search(new RegExp(value, 'i')) !== -1) {
            item.visible = true;
        } else {
            item.visible = false;
        }
    });

    template.universeSelect.items.set(items);
};

var _getOptionsFromMethod = function (searchText, values, template) {
    var optionsMethod = template.data.atts.optionsMethod;
    var optionsMethodParams = template.data.atts.optionsMethodParams;
    var searchVal;

    if (!optionsMethod) {
        return false;
    }

    searchVal = {
        searchText: searchText,
        values: values || [],
        params: optionsMethodParams || null
    };

    template.universeSelect.loading.set(true);

    Meteor.call(optionsMethod, searchVal, function (err, res) {
        var items = template.universeSelect.items.get() || [];
        var items_selected = [];

        _.each(items, function (item) {
            if(values && _.indexOf(values, item.value) !== -1){
                item.selected = true;
                items_selected.push(item);
            } else if(values === null && item.selected){
                items_selected.push(item);
            }
        });

        _.each(res, function (obj) {
            if (_.find(items_selected, function (item) {
                    return item.value === obj.value;
                })) {
                return;
            }

            items_selected.push({
                label: obj.label,
                value: obj.value,
                selected: _.indexOf(values, obj.value) !== -1,
                visible: true
            });
        });

        template.universeSelect.items.set(items_selected);
        template.universeSelect.loading.set(false);
        _setVisibleByValue(searchText, template);
    });
};
