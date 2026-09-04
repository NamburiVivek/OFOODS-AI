const PRODUCT_CATALOG = [
    // ── VEG PICKLES ──
    {id:1,  name:'Tomato Pickle (టమాటా పచ్చడి)',               price:179, cat:'veg-pickles',    catLabel:'Veg Pickle',       desc:'Tangy sun-dried tomato pickle with red chilli, mustard & sesame oil.'},
    {id:2,  name:'Mango Pickle (మామిడికాయ పచ్చడి)',                price:179, cat:'veg-pickles',    catLabel:'Veg Pickle',       desc:'Traditional Andhra raw mango pickle with mustard, red chilli & sesame oil.'},
    {id:3,  name:'Red Chilli Pickle (పండు మిర్చి పచ్చడి)',           price:169, cat:'veg-pickles',    catLabel:'Veg Pickle',       desc:'Bold ripe red chilli pickle with gingelly oil and mustard seeds.'},
    {id:4,  name:'Gongura Pickle (గోంగూర పచ్చడి)',              price:169, cat:'veg-pickles',    catLabel:'Veg Pickle',       desc:'Zesty gongura pickle in a tangy tamarind and chilli base.'},
    {id:6,  name:'Gongura & Red Chilli Pickle',                 price:179, cat:'veg-pickles',    catLabel:'Veg Pickle',       desc:'Sorrel leaf and red chilli pickle — bold, sour and addictive.'},
    {id:7,  name:'Lemon Pickle (నిమ్మకాయ పచ్చడి)',                price:169, cat:'veg-pickles',    catLabel:'Veg Pickle',       desc:'Sun-cured lemon wedges in a tangy spiced brine with fenugreek.'},
    {id:8,  name:'Amla Pickle (ఉసిరికాయ పచ్చడి)',                 price:179, cat:'veg-pickles',    catLabel:'Veg Pickle',       desc:'Indian gooseberry pickle with mustard, chilli and spices.'},
    {id:9,  name:'Coriander & Mint Pickle',                      price:179, cat:'veg-pickles',    catLabel:'Veg Pickle',       desc:'Fresh coriander and mint blended into a vibrant aromatic pickle.'},
    {id:10, name:'Drumstick Pickle (మునగకాయ పచ్చడి)',           price:169, cat:'veg-pickles',    catLabel:'Veg Pickle',       desc:'Tender drumstick pieces blended with traditional spices.'},
    {id:11, name:'Raw Tamarind Pickle (చింతకాయ పచ్చడి)',          price:169, cat:'veg-pickles',    catLabel:'Veg Pickle',       desc:'Tangy raw tamarind blended with premium spices.'},
    // ── NON-VEG PICKLES ──
    {id:12, name:'Chicken Pickle With Bones',                    price:329, cat:'nonveg-pickles', catLabel:'Non-Veg Pickle',   desc:'Country chicken pieces slow-cooked in spicy Andhra marinade with bones.'},
    {id:13, name:'Boneless Chicken Pickle (చికెన్ పచ్చడి బోన్‌లెస్)',price:379, cat:'nonveg-pickles', catLabel:'Non-Veg Pickle',   desc:'Tender boneless chicken chunks in a fiery red chilli & gingelly oil base.'},
    {id:14, name:'Prawns Pickle (రొయ్యల పచ్చడి)',               price:509, cat:'nonveg-pickles', catLabel:'Non-Veg Pickle',   desc:'Juicy prawns marinated in coastal Andhra spices — tangy and bold.'},
    {id:15, name:'Mutton Pickle (మటన్ పచ్చడి)',               price:629, cat:'nonveg-pickles', catLabel:'Non-Veg Pickle',   desc:'Slow-cooked mutton pieces in a rich spicy pickle masala.'},
    // ── MASALA POWDERS ──
    {id:31, name:'Garam Masala Powder',                          price:99,  cat:'spices',         catLabel:'Masala Powder',    desc:'Whole spices stone-ground: cloves, cinnamon, cardamom & black pepper.'},
    {id:32, name:'Sambar Masala Powder',                         price:99,  cat:'spices',         catLabel:'Masala Powder',    desc:'Authentic homestyle blend with coriander, cumin, curry leaves & dry chilli.'},
    {id:33, name:'Rasam Powder',                                 price:89,  cat:'spices',         catLabel:'Masala Powder',    desc:'Tangy, peppery rasam spice blend for authentic South Indian soup.'},
    {id:34, name:'Chicken Masala Powder',                        price:109, cat:'spices',         catLabel:'Masala Powder',    desc:'Bold aromatic masala blend crafted for chicken curries and biryanis.'},
    {id:35, name:'Mutton Masala Powder',                         price:109, cat:'spices',         catLabel:'Masala Powder',    desc:'Rich, robust mutton masala with whole dry spices for depth of flavour.'},
    // ── KARAM POWDERS ──
    {id:36, name:'Sambar Chilli Powder',                         price:89,  cat:'spices',         catLabel:'Karam Powder',     desc:'Classic Andhra-style sambar chilli powder with curry leaves & garlic.'},
    {id:37, name:'Green Chilli Powder',                          price:89,  cat:'spices',         catLabel:'Karam Powder',     desc:'Fresh raw green chilli powder blend — fiery and flavourful.'},
    {id:38, name:'Curry Leaf Chilli Powder',                     price:89,  cat:'spices',         catLabel:'Karam Powder',     desc:'Aromatic curry leaf chilli powder — a South Indian staple.'},
    {id:39, name:'Coconut Chilli Powder',                        price:89,  cat:'spices',         catLabel:'Karam Powder',     desc:'Toasted coconut and red chilli powder blend, great with rice.'},
    {id:40, name:'Dry Roasted Spice Powder',                     price:89,  cat:'spices',         catLabel:'Karam Powder',     desc:'Traditional Andhra dry roasted spice powder for rice and curries.'},
    {id:41, name:'Drumstick Leaf Powder',                        price:89,  cat:'spices',         catLabel:'Karam Powder',     desc:'Nutritious drumstick leaf chilli powder packed with iron and vitamins.'},
    {id:42, name:'Idli Chilli Powder',                           price:99,  cat:'spices',         catLabel:'Karam Powder',     desc:'Classic South Indian idly chilli powder — perfect with ghee on idly.'},
    {id:43, name:'Idli Chutney Powder',                          price:89,  cat:'spices',         catLabel:'Karam Powder',     desc:'Urad dal chutney powder, great with idly, dosa and hot rice with oil.'},
    {id:44, name:'Sesame Chilli Powder',                         price:89,  cat:'spices',         catLabel:'Karam Powder',     desc:'Toasted sesame seed powder with chilli — nutty, rich and fragrant.'},
    // ── CHIPS & VADIYALU ──
    {id:50, name:'Rice Flour Wafers',                            price:129, cat:'chips',          catLabel:'Chips & Vadiyalu', desc:'Classic sun-dried rice flour wafers — crispy, light and perfect with rice.'},
    {id:51, name:'Semolina Wafers',                              price:179, cat:'chips',          catLabel:'Chips & Vadiyalu', desc:'Semolina sun-dried chips with subtle spices — a South Indian staple.'},
    {id:52, name:'Tomato Wafers',                                price:159, cat:'chips',          catLabel:'Chips & Vadiyalu', desc:'Tangy tomato-flavoured sun-dried chips — great with rice and dal.'},
    {id:58, name:'Beetroot Wafers',                              price:159, cat:'chips',          catLabel:'Chips & Vadiyalu', desc:'Beautiful ruby-red beetroot chips — naturally sweet and earthy.'},
    {id:59, name:'Carrot Wafers',                                price:139, cat:'chips',          catLabel:'Chips & Vadiyalu', desc:'Lightly spiced carrot sun-dried chips — wholesome and crunchy.'},
    // ── SNACKS ──
    {id:70, name:'Boondi Mixture',                               price:109, cat:'snacks',         catLabel:'Hot Snack',        desc:'Crunchy chickpea flour boondi tossed with spiced mixture, peanuts and sev.'},
    {id:71, name:'Rice Crackers (చెక్కలు)',                       price:89,  cat:'snacks',         catLabel:'Hot Snack',        desc:'Crispy sago/rice flour cookies — a classic Andhra teatime snack.'},
    {id:72, name:'Chakaralu (చక్కరాలు)',                          price:109, cat:'snacks',         catLabel:'Hot Snack',        desc:'Traditional urad and chana dal crispy rings — crunchy and savoury.'},
    // ── SWEETS ──
    {id:73, name:'Gram Flour Laddu (లడ్డూ)',                     price:109, cat:'snacks',         catLabel:'Sweet',            desc:'Soft round sweet made with besan or boondi — a festive favourite.'},
    {id:74, name:'Shell Shaped Sweet (గవ్వలు)',                   price:119, cat:'snacks',         catLabel:'Sweet',            desc:'Shell-shaped crispy sweet snack made from maida with jaggery syrup.'},
    {id:75, name:'Crescent Sweet (కాజాలు)',                      price:109, cat:'snacks',         catLabel:'Sweet',            desc:'Crescent moon-shaped crispy sweet — light and delicately sweet.'},
    {id:76, name:'Sweet Boondi',                                 price:129, cat:'snacks',         catLabel:'Sweet',            desc:'Sweet saffron-infused boondi — tiny sugar-coated pearls of joy.'},
    {id:77, name:'Roasted Gram Laddu (సున్నుండలు)',               price:209, cat:'snacks',         catLabel:'Sweet',            desc:'Traditional Andhra sweet balls made with roasted gram flour and jaggery.'},
    {id:78, name:'Sesame Laddu',                                 price:159, cat:'snacks',         catLabel:'Sweet',            desc:'Traditional sesame seed laddu — nutty, sweet and nutritious.'},
    {id:79, name:'Rice Flour Sweet (చలిమిడి)',                   price:179, cat:'snacks',         catLabel:'Sweet',            desc:'Traditional Andhra rice flour sweet with coconut — soft and aromatic.'},
];

module.exports = { PRODUCT_CATALOG };
