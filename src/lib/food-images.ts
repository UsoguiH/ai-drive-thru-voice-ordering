// Food image mapping for order items
export const FOOD_IMAGES = {
  // Arabic names
  'سبرايت': '/food-images/sprite.png',
  'بطاطس': '/food-images/fries.png',
  'ماء': '/food-images/water.png',
  'برجر الجبن': '/food-images/cheese-burger.png',
  'برجر دجاج': '/food-images/chicken-burger.png',
  'برجر نباتي': '/food-images/veggie-burger.png',
  'كوكا كولا': '/food-images/cola.png',
  'عصير برتقال': '/food-images/orange-juice.png',

  // English names
  'sprite': '/food-images/sprite.png',
  'french fries': '/food-images/fries.png',
  'fries': '/food-images/fries.png',
  'water': '/food-images/water.png',
  'cheeseburger': '/food-images/cheese-burger.png',
  'cheese burger': '/food-images/cheese-burger.png',
  'chicken burger': '/food-images/chicken-burger.png',
  'veggie burger': '/food-images/veggie-burger.png',
  'vegetarian burger': '/food-images/veggie-burger.png',
  'cocacola': '/food-images/cola.png',
  'coca cola': '/food-images/cola.png',
  'coca-cola': '/food-images/cola.png',
  'orange juice': '/food-images/orange-juice.png',
} as const;

// Function to get food image by name
export function getFoodImage(itemName: string): string | null {
  // Try exact match first (case insensitive)
  const lowerItemName = itemName.toLowerCase().trim();

  // Check Arabic names first
  for (const [name, path] of Object.entries(FOOD_IMAGES)) {
    if (name.toLowerCase() === lowerItemName) {
      return path;
    }
  }

  // Check partial matches for Arabic names
  if (lowerItemName.includes('بطاطس')) return FOOD_IMAGES['بطاطس'];
  if (lowerItemName.includes('برجر')) {
    if (lowerItemName.includes('جبن')) return FOOD_IMAGES['برجر الجبن'];
    if (lowerItemName.includes('دجاج')) return FOOD_IMAGES['برجر دجاج'];
    if (lowerItemName.includes('نباتي')) return FOOD_IMAGES['برجر نباتي'];
  }
  if (lowerItemName.includes('كوكا') || lowerItemName.includes('كولا')) return FOOD_IMAGES['كوكا كولا'];
  if (lowerItemName.includes('عصير') && lowerItemName.includes('برتقال')) return FOOD_IMAGES['عصير برتقال'];
  if (lowerItemName.includes('ماء')) return FOOD_IMAGES['ماء'];
  if (lowerItemName.includes('سبرايت')) return FOOD_IMAGES['سبرايت'];

  // Check partial matches for English names
  if (lowerItemName.includes('french') || lowerItemName.includes('fries')) return FOOD_IMAGES['fries'];
  if (lowerItemName.includes('burger')) {
    if (lowerItemName.includes('cheese')) return FOOD_IMAGES['cheeseburger'];
    if (lowerItemName.includes('chicken')) return FOOD_IMAGES['chicken burger'];
    if (lowerItemName.includes('veggie') || lowerItemName.includes('vegetarian')) return FOOD_IMAGES['veggie burger'];
  }
  if (lowerItemName.includes('cola') || lowerItemName.includes('coca')) return FOOD_IMAGES['coca cola'];
  if (lowerItemName.includes('orange') && lowerItemName.includes('juice')) return FOOD_IMAGES['orange juice'];
  if (lowerItemName.includes('water')) return FOOD_IMAGES['water'];
  if (lowerItemName.includes('sprite')) return FOOD_IMAGES['sprite'];

  // Default food image
  return '/food-images/default-food.svg';
}

// Default placeholder for items without images
export const DEFAULT_FOOD_IMAGE = '/food-images/default-food.svg';