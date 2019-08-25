<template>
  <div id="app">
    <FileTransfer />
  </div>
</template>

<script>
import FileTransfer from './components/FileTransfer.vue'


export default {
  name: 'app',
  components: {
    FileTransfer
  }
}
</script>

<style>
@import url('../node_modules/bulma/css/bulma.css');

#app {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: white;
  background-color: black;
  height: 100vh;
  padding: 50px 20px 20px 20px;
}
</style>
