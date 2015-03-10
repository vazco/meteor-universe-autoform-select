vazco:universe-autoform-select
=========================

An add-on Meteor package for [aldeed:autoform](https://github.com/aldeed/meteor-autoform). Provides a single custom input type, "afUniverseSelect".

## Prerequisites

The plugin library must be installed separately.

In a Meteor app directory, enter:

```bash
$ meteor add aldeed:autoform
```

## Installation

In a Meteor app directory, enter:

```bash
$ meteor add vazco:universe-autoform-select
```

## Usage

Specify "afUniverseSelect" for the `type` attribute of any input. This can be done in a number of ways:

In the schema, which will then work with a `quickForm` or `afQuickFields`:

```js
{
  tags: {
    type: [String],
    autoform: {
      type: "afUniverseSelect",
      afFieldInput: {
        multiple: true
      }
    }
  }
}
```

Or on the `afFieldInput` component or any component that passes along attributes to `afFieldInput`:

```js
{{> afQuickField name="tags" type="afUniverseSelect" multiple=true}}

{{> afFormGroup name="tags" type="afUniverseSelect" multiple=true}}

{{> afFieldInput name="tags" type="afUniverseSelect" multiple=true}}
```

