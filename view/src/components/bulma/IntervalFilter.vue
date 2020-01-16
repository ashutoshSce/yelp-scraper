<template>
  <div class="interval-filter">
    <div class="has-text-centered">
      <strong>{{ title }}</strong>
    </div>
    <div class="columns is-mobile">
      <div class="column">
        <div class="control has-icons-right">
          <input
            v-model="interval.min"
            :class="['input control', { 'is-danger': invalid }]"
            :placeholder="minLabel"
            :type="type"
            @input="update"
          >
          <span
            v-if="interval.min"
            class="icon is-small is-right clear-button"
            @click="interval.min = null; update()"
          >
            <a class="delete is-small" />
          </span>
        </div>
      </div>
      <div class="column">
        <div class="control has-icons-right">
          <input
            v-model="interval.max"
            :class="['input control', { 'is-danger': invalid }]"
            :placeholder="maxLabel"
            :type="type"
            @input="update"
          >
          <span
            v-if="interval.max"
            class="icon is-small is-right clear-button"
            @click="interval.max = null; update()"
          >
            <a class="delete is-small" />
          </span>
        </div>
      </div>
    </div>
  </div>
  </div>
</template>

<script>

import { VTooltip } from 'v-tooltip';

export default {
  name: 'IntervalFilter',

  directives: { tooltip: VTooltip },

  props: {
    maxLabel: {
      type: String,
      default: 'Max',
    },
    minLabel: {
      type: String,
      default: 'Min',
    },
    title: {
      type: String,
      default: null,
    },
    type: {
      type: String,
      default: 'number',
    },
  },

  data: () => ({
    interval: {
      min: null,
      max: null,
    },
  }),

  computed: {
    invalid() {
      return this.interval.min !== null
                && this.interval.max !== null
                && this.interval.min > this.interval.max;
    },
  },

  methods: {
    update() {
      this.$emit('update', this.interval);
    },
  },
};

</script>

<style lang="scss" scoped>
    .interval-filter {
        padding: 0.5rem;
        .header {
            border-top-left-radius: inherit;
            border-top-right-radius: inherit;
            padding-top: 0.5em;
        }

        .input-wrapper {
            border-radius: inherit;
            padding: 0.25em;
        }

        .control.has-icons-right .icon.clear-button {
            pointer-events: all;
        }
    }

</style>
