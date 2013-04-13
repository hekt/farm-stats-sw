(function($) {
  $(function() {
      var BASE_QUERY = 'select * from swdata where team = ';
      var BATTING_URL =
          "https://api.scraperwiki.com/api/1.0/datastore/sqlite?format=jsondict&name=npb-farm-stats-b&query=";
      var PITCHING_URL =
          "https://api.scraperwiki.com/api/1.0/datastore/sqlite?format=jsondict&name=npb-farm-stats-p&query=";
      var BATTING_STATS =
          ['team', 'bats', 'name', 'g', 'pa', 'ab', 'r', 'h', 'dbl', 'tpl',
           'hr',  'tb', 'rbi', 'sb', 'cs', 'sbp', 'sh', 'sf', 'bb', 'ibb',
           'hbp', 'so', 'gd', 'avg', 'slg', 'obp', 'ops', 'noi', 'gpa', 'rc',
           'rc27', 'xr', 'xr27', 'babip', 'isop', 'isod'];
      var PITCHING_STATS =
          ['team', 'throws', 'name', 'g', 'w', 'l', 'sv', 'cg', 'sho', 'zbc',
           'wpct', 'bf', 'ip', 'h', 'hr', 'bb', 'ibb', 'hbp', 'so', 'wp', 'bk',
           'r', 'er', 'era', 'whip', 'fip', 'lobp', 'kbb', 'k9', 'bb9', 'hr9',
           'ipg', 'babip'];
      var batting_flags =
          {'team': 1, 'bats': 0, 'name': 1, 'g': 1, 'pa': 1, 'ab': 1, 'r': 1,
           'h': 1, 'dbl': 0, 'tpl': 0, 'hr': 1,  'tb': 0, 'rbi': 1, 'sb': 1,
           'cs': 0, 'sbp': 0, 'sh': 1, 'sf': 1, 'bb': 1, 'ibb': 0, 'hbp': 1,
           'so': 1, 'gd': 1, 'avg': 1, 'slg': 0, 'obp': 0, 'ops': 1, 'noi': 0,
           'gpa': 0, 'rc': 0, 'rc27': 0, 'xr': 0, 'xr27': 0, 'babip': 0,
           'isop': 0, 'isod': 0};
      var pitching_flags =
          {'team': 1, 'throws': 0, 'name': 1, 'g': 1, 'w': 1, 'l': 1, 'sv': 1,
           'cg': 0, 'sho': 0, 'zbc': 0, 'wpct': 1, 'bf': 0, 'ip': 1, 'h': 1,
           'hr': 0, 'bb': 1, 'ibb': 0, 'hbp': 0, 'so': 1, 'wp': 1, 'bk': 1,
           'r': 0, 'er': 1, 'era': 1, 'whip': 1, 'fip': 0, 'lobp': 0, 'kbb': 0,
           'k9': 0, 'bb9': 0, 'hr9': 0, 'ipg': 0, 'babip': 0}
      var loaded_team_flags =
          {'m': 0, 'g': 0, 'db': 0, 'e': 0, 'f': 0, 's': 0, 'l': 0,
           't': 0, 'bs': 0, 'h': 0, 'd': 0, 'c': 0}

      var flags, reg_stats, STATS, BASE_URL;
      if ($("html").attr("class") == "batting") {
          STATS = BATTING_STATS;
          BASE_URL = BATTING_URL;
          flags = batting_flags;
          reg_stats = 'pa';
      } else {
          STATS = PITCHING_STATS;
          BASE_URL = PITCHING_URL;
          flags = pitching_flags;
          reg_stats = 'ip';
      }

      var filter_temp = "";

      function ajaxLoader(team) {
          var query = BASE_QUERY + "'" + team + "'";
          $.ajax({
              url: BASE_URL + encodeURI(query),
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
                      if (flags[st] === 0) {
                          cell.addClass('hide_column');
                      }
                      row.append(cell);
                  }
                  table.append(row);
              }
          }
          paFilter(filter_temp);
          $("#main_table").trigger("update");
      }

      function initCheckboxes() {
          $(".view_stats input").filter(function() {
              return flags[$(this).val()] == 1;
          }).attr("checked", true);
      }
      function initThs() {
          $("#main_table th").filter(function () {
              return flags[$(this).attr("class")] == 0;
          }).addClass("hide_column");
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
              flags[elem.val()] = 1;
              $("#main_table tr ." + elem.val()).removeClass("hide_column");
          } else {
              flags[elem.val()] = 0;
              $("#main_table tr ." + elem.val()).addClass("hide_column");
          } 
      }
      function toggleTeam(elem) {
          team = elem.val();
          if (loaded_team_flags[team] == 0) {
              elem.parent().parent().addClass('loading');
              ajaxLoader(team);
              loaded_team_flags[team] = 1;
          } else {
              $("#main_table tr." + team).toggleClass("hide_column");
          }
      }
      function paFilter(exp) {
          $("#main_table tr.filtered").removeClass("filtered");
          f = comp(exp);
          n = exp.match(/[0-9]+/)
          if (!n) {
              return false;
          } else {
              n = n[0]
          }
          $("#main_table td." + reg_stats).filter( function() {
              m = parseFloat($(this).html());
              return !f(m, n);
          }).parent().addClass('filtered');

          filter_temp = exp;
      }
      function comp(exp) {
          if (exp.indexOf(">=") == 0) {
              return function(n, m) {return n >= m};
          } else if (exp.indexOf("<=") == 0) {
              return function(n, m) {return n <= m};
          } else if (exp.indexOf("<") == 0) {
              return function(n, m) {return n < m};
          } else if (exp.indexOf(">") == 0) {
              return function(n, m) {return n > m};
          } else if (exp.indexOf("=") == 0) {
              return function(n, m) {return n == m};
          } else {
              return function(n, m) {return n >= m};
          }
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
          $(this).children("input").blur();
          return false;
      });

      initCheckboxes();
      initThs();
      $("#main_table").tablesorter();
  });
})(jQuery);
