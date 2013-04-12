(function($) {
  $(function() {

      var BASE_QUERY = '* from swdata where team = ';
      var STATS = ['team', 'bats', 'name', 'g', 'pa', 'ab', 'r', 'h', 'dbl', 'tpl', 'hr',  'tb', 'rbi', 'sb', 'cs', 'sbp', 'sh', 'sf', 'bb', 'ibb', 'hbp', 'so', 'gd', 'avg', 'slg', 'obp', 'ops', 'noi', 'gpa', 'rc', 'rc27', 'xr', 'xr27', 'babip', 'isop', 'isod']
      var showSwitch = {'team': 1, 'bats': 0, 'name': 1, 'g': 1, 'pa': 1, 'ab': 1, 'r': 1, 'h': 1, 'dbl': 0, 'tpl': 0, 'hr': 1,  'tb': 0, 'rbi': 1, 'sb': 1, 'cs': 0, 'sbp': 0, 'sh': 1, 'sf': 1, 'bb': 1, 'ibb': 0, 'hbp': 1, 'so': 1, 'gd': 1, 'avg': 1, 'slg': 0, 'obp': 0, 'ops': 1, 'noi': 0, 'gpa': 0, 'rc': 0, 'rc27': 0, 'xr': 0, 'xr27': 0, 'babip': 0, 'isop': 0, 'isod': 0}
      var loadedFlags = {'m': 0, 'g': 0, 'de': 0, 'e': 0, 'f': 0, 's': 0, 'l': 0, 't': 0, 'bs': 0, 'h': 0, 'd': 0, 'c': 0}

      function printd(str) {
          var out = document.getElementById("debug");
          if (!out) return;
          out.value += str;
      }

      function ajaxLoader(team) {
          var query = BASE_QUERY + "'" + team + "'";
          $.ajax({
              url: 'https://views.scraperwiki.com/run/npb-farm-stats-b-json/?q=' + encodeURI(query),
              // url: './example_' + team + '.json',
              dataType: 'json',
              success: function(data){
                  $(".loading").removeClass("loading");
                  viewer(data);
              }
          });
      }

      function viewer(data) {
          var row, cell;
          var table = $("#main_table tbody")
          var team = data[0]['team'];

          for (i=0; i<data.length; i++) {
              if (data[i]['pa'] != 0) {
                  row = $("<tr></tr>").attr("class", team);
                  for (j=0; j<STATS.length; j++) {
                      st = STATS[j]
                      cell = $("<td></td>")
                          .attr("class", st)
                          .html(data[i][st])
                      if (showSwitch[st] === 0) {
                          cell.addClass('hide_column');
                      }
                      row.append(cell);
                  }
                  table.append(row);
              }
          }
          $("#main_table").trigger("update");
      }
      
      function toggleCheck(elem) {
          if (elem.attr("checked")) {
              elem.removeAttr("checked");
          } else {
              elem.attr("checked", "checked");
          }
      }
      function toggleStat(elem) {
          if (elem.attr("checked") == "checked") {
              showSwitch[elem.val()] = 1;
              $("#main_table tr ." + elem.val()).removeClass("hide_column");
          } else {
              showSwitch[elem.val()] = 0;
              $("#main_table tr ." + elem.val()).addClass("hide_column");
          } 
      }
      function toggleTeam(elem) {
          team = elem.val();
          if (loadedFlags[team] == 0) {
              elem.parent().parent().addClass('loading');
              ajaxLoader(team);
              loadedFlags[team] = 1;
          } else {
              $("#main_table tr." + team).toggleClass("hide_column");
          }
      }
      function paFilter(n) {
          $("#main_table tr.filtered").removeClass("filtered");
          $("#main_table td.pa").filter( function() {
              return !(parseInt($(this).html()) >= n);
          }).parent().addClass('filtered');
      }

      // pinned
      $("#main_table").delegate("td", "click", function() {
          $(this).parent().toggleClass("pinned");
      });
      $("#main_table").delegate("td", "dblclick", function() {
          $(".pinned").removeClass("pinned");
          $(this).parent().addClass("pinned");
      });

      // events
      $(".controllers h1").click(
          function() { 
              $(this).parent().toggleClass("show");
          });
      $(".view_stats input").change(function() {
          toggleStat($(this)); });
      $(".view_teams input").change(function() {
          toggleTeam($(this)); });
      $(".pa_filter input").focus(function() {
          $(this).val('');
          $('.pa_filter').addClass('active')
      });
      $(".pa_filter input").blur(function() {
          if ($(this).val() == '') {
              $(this).val('打席フィルター');
          }
          $('.pa_filter').removeClass('active') });
      $(".pa_filter form").submit(function() {
          var v = $(this).children("input").val()
          if (!v) { v = "0"; }
          paFilter($(this).children("input").val());
          return false;
      });

      $("#main_table").tablesorter();
  });
})(jQuery);
