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

        return context;
    }
});

Template.afUniverseSelect.rendered = function () {
    var template = this;

    template.vazcoSelect = {};
    template.vazcoSelect.items = new ReactiveVar();
    template.vazcoSelect.values = new ReactiveVar();

    template.autorun(function () {
        var data = Template.currentData();
        var values = [];
        var el = $(template.find('select'));

        _.each(data.items, function (item) {
            if (item.selected) {
                values.push(item.value);
            }
        });

        template.vazcoSelect.values.set(values);
        template.vazcoSelect.items.set(data.items);
    });

    template.autorun(function () {
        var values = template.vazcoSelect.values.get();
        var input = $(template.find('.universeSelectValue'));

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
                if(!item.selected){
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
        var input = $(template.find('.universeSelectValue'));

        values = _.without(values, val);

        template.vazcoSelect.values.set(values);

        if (!_.isEqual(input.val(), values)) {
            input.val(values).change();
        }
    },
    'click .selectize-dropdown-content > div': function (e, template) {
        var el = $(e.target);
        var val = el.attr('data-value');
        var values = template.vazcoSelect.values.get();
        var input = $(template.find('.universeSelectValue'));

        values = _.union(values, val);

        template.vazcoSelect.values.set(values);

        if (!_.isEqual(input.val(), values)) {
            input.val(values).change();
        }
    }
});