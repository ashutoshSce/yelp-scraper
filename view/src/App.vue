<template>
  <div id="app">
    <h1>
      <strong>Yelp Scraper</strong>
    </h1>
    <restaurant-datatable style="margin-top:1rem;" />
  </div>
</template>

<script>
import RestaurantDatatable from './pages/restaurantDatatable';

export default {
  name: 'App',
  components: {
    RestaurantDatatable,
  },
};
</script>

<style lang="scss">
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin: 1rem;
}
</style>
