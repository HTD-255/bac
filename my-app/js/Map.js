let map; // Khai báo biến map ở đây, không cần khởi tạo

const baseUrl ='https://atlas.microsoft.com/map/tile?zoom={z}&x={x}&y={y}&tileSize=256&language=EN&&api-version=2.0';

let subscriptionKey, currentLayer;
subscriptionKey = "A2lqjZiOtaL20Flu7gM4mzeftWWp84zFGAyQVixGQ247rdF3KKX9JQQJ99BIACYeBjFP0sF6AAAgAZMP39e8";

const someTilesetId = [
  'microsoft.imagery',
  'microsoft.base.road',
  'microsoft.base.darkgrey',
];

const routeCoords = [
  [103.8033, 10.54],
  [103.79, 10.5],
  [103.82, 10.4267],
  [103.8, 10.4017],
  [102.95, 9.9083],
  [102.92, 9.9033],
  [102.8917, 9.9167],
  [103.1711, 9.5834],
  [102.2017, 8.7817],
  [103.0417, 7.8167],
  [103.7083, 7.3667],
  [103.65, 7.3333],
  [103.5952, 7.3052],
  [103.8667, 7.05],
  [105.82, 6.0967],
  [106.2, 6.25],
  [106.3167, 6.25],
  [106.6617, 6.35],
  [109.2867, 6.8367],
  [109.5683, 6.415],
  [109.8414, 6.0527],
  [111.331917, 6.031434],
  [112.605945, 6.353418],
  [113.6883, 6.7392],
  [115, 7.6619],
  [116.9167, 9.0214],
  [117.9783, 10.345],
  [117.8283, 11.1183],
  [117.469893, 12.219954],
  [117.266333, 12.769167],
  [117.072782, 13.283779],
  [116.8235, 13.8471],
  [116.8083, 13.8618],
  [116.5207, 16.2592],
  [116.99, 17.8225],
  [117.4442, 18.6421],
  [117.6259, 19.743],
  [116.1876, 18.9288],
  [114.6131, 18.5129],
  [113.5533, 17.4329],
  [112.9815, 17.0822],
  [112.9843, 17.1517],
  [112.9486, 17.2212],
  [112.7453, 17.3524],
  [112.4322, 17.5017],
  [112.1438, 17.5515],
  [111.6192, 17.6274],
  [111.5286, 17.6274],
  [111.4434, 17.6065],
  [111.3583, 17.5515],
  [111.2896, 17.4598],
  [110.9795, 16.4481],
  [109.4958, 16.7817],
  [108.5572, 17.3317],
  [107.9667, 17.7833],
  [107.6517, 18.07],
  [107.6267, 18.1183],
  [107.5667, 18.23],
  [107.16, 18.715],
  [107.16, 19.215],
  [107.19, 19.2683],
  [107.2117, 19.4233],
  [107.35, 19.4233],
  [107.5283, 19.6583],
  [107.93, 19.9583],
  [108.3792, 20.4017],
  [108.2083, 21.21],
  [108.135, 21.275],
  [108.095, 21.4517],
  [108.0933, 21.4567],
  [108.095, 21.4583],
  [108.0967, 21.46],
  [108.0983, 21.4633],
  [108.1, 21.4667],
  [108.1, 21.47],
];

// 3. Tạo một đối tượng LineString với các tọa độ gốc
const routeLine = new LineString(routeCoords);

// 4. Tạo một Feature từ đối tượng LineString
const routeFeature = new Feature({
  geometry: routeLine,
});

// 5. Tạo một Style cho đường
const lineStyle = new Style({
  stroke: new Stroke({
    color: 'red',
    width: 2,
    lineDash: [10, 10], // Đường nét đứt: 10px nét, 10px hở
  }),
});

routeFeature.setStyle(lineStyle);

// Tạo một Vector Source và thêm Feature vào đó
const vectorSource = new VectorSource({
  features: [routeFeature],
});

// Tạo một Vector Layer và liên kết với Vector Source
const vectorLayer = new VectorLayer({
  source: vectorSource,
});



// Layer Ship
const vectorSourceShip = new VectorSource({
  features: [], // Khởi tạo với mảng rỗng
});
// Tạo một lớp vector
const vectorLayerShip = new VectorLayer({
  source: vectorSourceShip,
});

const vectorSourceHaiTrinh = new VectorSource({
  features: [], // Khởi tạo với mảng rỗng
});
const vectorLayerHaiTrinh = new VectorLayer({
  source: vectorSourceHaiTrinh,
});

function drawShips(shipsData) {
  // Xóa tất cả các điểm cũ
  vectorSourceShip.clear();

  const features = shipsData.map(location => {
    // Tạo một điểm (Feature) cho mỗi con tàu
    const feature = new Feature({
      geometry: new Point([location.long, location.lat]),
    });
    console.log(location);

    feature.set('id_ship', location.id_ship); // Lưu thông tin tàu vào feature
    feature.set('id', location.Id); // Lưu thông tin tàu vào feature

    // Gán kiểu cho điểm
    feature.setStyle(simpleCircleStyle);

    return feature;
  });
  console.log(features);
  // Thêm tất cả các điểm mới vào nguồn vector
  vectorSourceShip.addFeatures(features);
}