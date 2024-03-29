<template>
  <div>
    <div class="columns">
      <div class="column is-3-desktop is-8-tablet is-12-mobile">
        <vue-select-filter
          class="box"
          title="Price Range"
          multiple
          :options="priceRangeList"
          v-model="filters.priceRange"
        />
      </div>
      <div class="column is-3-desktop is-8-tablet is-12-mobile">
        <vue-select-filter
          class="box"
          title="Locations"
          multiple
          :source="'api/v1/restaurant-filter/localities'"
          v-model="filters.localities"
        />
      </div>
      <div class="column is-3-desktop is-8-tablet is-12-mobile">
        <vue-select-filter
          class="box"
          title="Cuisines"
          multiple
          :source="'api/v1/restaurant-filter/categories'"
          v-model="filters.categories"
        />
      </div>
      <div class="column is-3-desktop is-8-tablet is-12-mobile">
        <vue-select-filter
          class="box"
          title="Services"
          multiple
          :options="services"
          v-model="filters.services"
        />
      </div>
      <div class="column is-3-desktop is-8-tablet is-12-mobile">
        <vue-select-filter
          class="box"
          title="Neighborhoods"
          multiple
          :source="'api/v1/restaurant-filter/neighborhoods'"
          v-model="filters.neighborhoods"
        />
      </div>
    </div>
    <div class="columns">
      <div class="column is-3-desktop is-8-tablet is-12-mobile">
        <interval-filter
          class="box"
          title="Rating"
          @update="intervals.rating.min = $event.min; intervals.rating.max = $event.max;"
        />
      </div>
      <div class="column is-3-desktop is-8-tablet is-12-mobile">
        <vue-select-filter
          class="box"
          title="Sponsored"
          multiple
          :options="sponsorshipList"
          v-model="filters.isAd"
        />
      </div>
    </div>
    <vue-table
      class="box is-paddingless raises-on-hover is-rounded"
      :path="path"
      :filters="filters"
      :intervals="intervals"
      :id="'yelp-scraper'"
    >
      <span
        slot="type"
        slot-scope="{ row }"
        :class="[
          'tag is-table-tag',
          row.isRead ? 'is-success' : 'is-warning'
        ]"
      >
        {{ row.type }}
      </span>
    </vue-table>
  </div>
</template>

<script>
import { library } from '@fortawesome/fontawesome-svg-core';
import { faEye } from '@fortawesome/free-solid-svg-icons';
import VueTable from '../components/vuedatatable/VueTable.vue';
import VueSelectFilter from '../components/select/VueSelectFilter.vue';
import IntervalFilter from '../components/bulma/IntervalFilter.vue';

library.add(faEye);

export default {
  name: 'RestaurantDatatable',

  components: { VueTable, VueSelectFilter, IntervalFilter },

  data() {
    return {
      path: '/template.json',
      priceRangeList: [],
      services: [],
      sponsoredList: [],
      filters: {
        services: [],
        priceRange: [],
        categories: [],
        localities: [],
        neighborhoods: [],
        isAd: [],
      },
      intervals: {
        rating: {
          min: null,
          max: null,
        },
      },
    };
  },

  created() {
    this.priceRangeList = [
      { name: 'Inexpensive', id: '$' },
      { name: 'Moderate', id: '$$' },
      { name: 'Pricey', id: '$$$' },
      { name: 'Ultra High-End', id: '$$$$' },
    ];
    this.sponsorshipList = [
      { name: 'Sponsored Results', id: 'true' },
      { name: 'Not Sponsored', id: 'false' },
    ];
    this.services = [
      { name: 'Delivery', id: 'Delivery' },
      { name: 'Takeout', id: 'Takeout' },
      { name: 'Outdoor dining', id: 'Outdoor dining' },
    ];
  },
};
</script>
