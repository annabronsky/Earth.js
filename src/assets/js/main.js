$.ajaxSetup({
  async: false
});

$(document).ready(function() {
  get_json();
  input_check();
  show_details();
});

var json;
var flags;
function get_json() {
  $.getJSON(`assets/json/db.json`, function(data) {
    json = data;
  });
  $.getJSON(`assets/json/flags.json`, function(data) {
    flags = data;
  });
}

function toTitleCase(phrase) {
  return phrase
    .toLowerCase()
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function input_check() {
  const category = "countries";
  const letters = /^[а-яА-Яієґї-]+$/;

  $("#gt").on("input", function() {
    let value = toTitleCase($(this).val());

    if (value && value.match(letters)) {
      render_suggestions(value);
    } else {
      $(".flex-center-results, .search-info").empty();
      $(".map").css({ visibility: "hidden" });
    }
  });
}

function get_flag(country_code) {
  return flags.find(e => e.code === country_code).emoji;
}

function render_suggestions(term) {
  function gather(fcl) {
    let res;
    $.getJSON(
      `http://api.geonames.org/searchJSON?lang=uk&name_startsWith=${term}&featureClass=${fcl}&username=zen`,
      function(data) {
        res = data.geonames.filter(e => e.population > 0);
      }
    );
    return res;
  }

  $(".flex-center-results").html(
    gather("P")
      .map(
        field =>
          `<div class='result list-group-item list-group-item-action'>${get_flag(
            field.countryCode
          )} ${field.name}, ${field.adminName1}, ${field.countryName}</div>`
      )
      .join(" ")
  );
}

function show_details() {
  class Entity {
    constructor(name) {
      this.name = name;
    }

    getField(field, term) {
      let retrieved = json.Countries.find(e => e["country_uk"] === term)[field];
      if (retrieved) {
        return retrieved.toLocaleString();
      } else {
        return "немає даних";
      }
    }
  }

  class Country extends Entity {
    constructor(name) {
      super(name);
      this.capital_uk = super.getField("capital_uk", name);
      this.continent = super.getField("continent", name);
      this.government = super.getField("government", name);
      this.population = super.getField("population", name);
      this.area = super.getField("area", name);
      this.country_en = super.getField("country_en", name);
    }

    output() {
      let items = [
        `Назва країни: ${this.name}`,
        `Столиця: ${this.capital_uk}`,
        `Материк: ${this.continent}`,
        `Форма правління: ${this.government}`,
        `Населення: ${this.population} осіб`,
        `Площа: ${this.area} км²`
      ];

      return items.map(field => `<div>${field}</div>`).join(" ");
    }
  }

  $("body").on("click", ".result", function(event) {
    let country_name = $(this).text();
    const result = new Country(country_name);

    $(".flex-center-results").empty();
    $(".search-info").html(result.output());
    $(".map").css({ visibility: "visible" });

    map.jumpTo({
      center: [52.441864013671875, 41.75389768415882],
      zoom: 14
    });

    map.getLayer();
    // Double click trigger fix
    event.stopImmediatePropagation();
  });
}
