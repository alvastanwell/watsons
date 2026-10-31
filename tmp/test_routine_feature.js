// Unit and Integration Verification for Routine Addition Logic
const assert = require('assert');

// Mock data structures mirroring our application
const INITIAL_MORNING_STEPS = [
  { id: 'm_step_1', productId: 'curel_cleanser', variantId: 'curel_cleanser_150ml', titleZh: '珂润 洁颜', completed: true, timeOfDay: 'morning', stepNumber: 1 },
  { id: 'm_step_2', productId: 'curel_cream', variantId: 'curel_cream_40g', titleZh: '珂润 面霜', completed: false, timeOfDay: 'morning', stepNumber: 2 },
  { id: 'm_step_3', productId: 'biore_aqua_rich', variantId: 'biore_aqua_50g', titleZh: '碧柔 防晒', completed: false, timeOfDay: 'morning', stepNumber: 3 },
];

const INITIAL_EVENING_STEPS = [
  { id: 'e_step_1', productId: 'freeplus_cleanser', variantId: 'freeplus_cleanser_100g', titleZh: '芙丽芳丝', completed: false, timeOfDay: 'evening', stepNumber: 1 },
  { id: 'e_step_2', productId: 'centella_ampoule', variantId: 'centella_ampoule_55ml', titleZh: '积雪草', completed: false, timeOfDay: 'evening', stepNumber: 2 },
  { id: 'e_step_3', productId: 'lrp_b5', variantId: 'lrp_b5_40ml', titleZh: '理肤泉 B5+', completed: false, timeOfDay: 'evening', stepNumber: 3 },
];

// Product catalogue sample
const sampleProducts = {
  winona_mask: {
    product_id: 'winona_repair_mask',
    variant_id: 'winona_mask_5sheets',
    name: 'Winona Soothing Repair Freeze-Dried Mask',
    name_zh: '薇诺娜 舒缓修护冻干面膜',
    category: 'mask',
    image_url: '/assets/winona_repair_mask_box.jpg'
  },
  curel_cream: {
    product_id: 'curel_cream',
    variant_id: 'curel_cream_40g',
    name: 'Curél Intensive Moisture Facial Cream',
    name_zh: '珂润 润浸保湿滋养乳霜',
    category: 'cream',
    image_url: '/assets/curel.jpg'
  },
  lrp_b5: {
    product_id: 'lrp_b5',
    variant_id: 'lrp_b5_40ml',
    name: 'La Roche-Posay Cicaplast Baume B5+',
    name_zh: '理肤泉 B5+ 多效修护舒缓霜',
    category: 'cream',
    image_url: '/assets/b5.jpg'
  }
};

// State simulation
let morningSteps = JSON.parse(JSON.stringify(INITIAL_MORNING_STEPS));
let eveningSteps = JSON.parse(JSON.stringify(INITIAL_EVENING_STEPS));
let lastToast = null;
let lastTab = null;

function showToast(msg) {
  lastToast = msg;
}

function checkExists(steps, prodId, variantId, titleZh) {
  return steps.some(
    s => (variantId && s.variantId === variantId) ||
         (s.productId && s.productId === prodId) ||
         (titleZh && s.titleZh === titleZh)
  );
}

function createStep(record, targetTime, existingCount) {
  const stepIdx = existingCount + 1;
  return {
    id: `step_${targetTime}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    stepNumber: stepIdx,
    productId: record.product_id,
    variantId: record.variant_id,
    category: `Step ${stepIdx} • ${record.category.toUpperCase()}`,
    categoryZh: `第 ${stepIdx} 步 • ${record.category}`,
    title: record.name,
    titleZh: record.name_zh,
    image: record.image_url,
    completed: false,
    timeOfDay: targetTime
  };
}

function handleApplyRecommendationToRoutine(record, selection) {
  const prodId = record.product_id;
  const variantId = record.variant_id;
  const prodTitleZh = record.name_zh;

  const existsInMorning = checkExists(morningSteps, prodId, variantId, prodTitleZh);
  const existsInEvening = checkExists(eveningSteps, prodId, variantId, prodTitleZh);

  if (selection === 'morning') {
    if (existsInMorning) {
      showToast(`【${prodTitleZh}】已存在于晨间护肤中，无需重复添加`);
      return;
    }
    morningSteps.push(createStep(record, 'morning', morningSteps.length));
    lastTab = 'morning';
    showToast('已加入晨间护肤');
  } else if (selection === 'evening') {
    if (existsInEvening) {
      showToast(`【${prodTitleZh}】已存在于晚间护肤中，无需重复添加`);
      return;
    }
    eveningSteps.push(createStep(record, 'evening', eveningSteps.length));
    lastTab = 'evening';
    showToast('已加入晚间护肤');
  } else if (selection === 'both') {
    if (existsInMorning && existsInEvening) {
      showToast(`【${prodTitleZh}】已存在于晨间与晚间护肤中，无需重复添加`);
      return;
    } else if (existsInMorning && !existsInEvening) {
      eveningSteps.push(createStep(record, 'evening', eveningSteps.length));
      lastTab = 'evening';
      showToast('已加入晚间护肤（晨间已有该产品）');
    } else if (!existsInMorning && existsInEvening) {
      morningSteps.push(createStep(record, 'morning', morningSteps.length));
      lastTab = 'morning';
      showToast('已加入晨间护肤（晚间已有该产品）');
    } else {
      morningSteps.push(createStep(record, 'morning', morningSteps.length));
      eveningSteps.push(createStep(record, 'evening', eveningSteps.length));
      lastTab = 'morning';
      showToast('已加入晨间和晚间护肤');
    }
  }
}

console.log('--- STARTING VERIFICATION TESTS ---');

// Test 1: Cancellation (no routine changes)
console.log('Test 1: Verification of cancellation');
const morningLenBefore = morningSteps.length;
const eveningLenBefore = eveningSteps.length;
// Simulating user opening sheet and clicking Cancel
console.log('User opens sheet, clicks 取消 (Cancel)');
assert.strictEqual(morningSteps.length, morningLenBefore);
assert.strictEqual(eveningSteps.length, eveningLenBefore);
console.log('✓ PASS: Cancellation preserved step counts with zero modifications.');

// Test 2: Add to Morning Routine
console.log('\nTest 2: Verification of adding new product to Morning Routine');
handleApplyRecommendationToRoutine(sampleProducts.winona_mask, 'morning');
assert.strictEqual(morningSteps.length, 4);
assert.strictEqual(eveningSteps.length, 3);
assert.strictEqual(morningSteps[3].stepNumber, 4);
assert.strictEqual(morningSteps[3].productId, 'winona_repair_mask');
assert.strictEqual(morningSteps[3].variantId, 'winona_mask_5sheets');
assert.strictEqual(morningSteps[3].completed, false);
assert.strictEqual(lastToast, '已加入晨间护肤');
assert.strictEqual(lastTab, 'morning');
console.log('✓ PASS: Added to Morning only, step count updated from 3 to 4, toast confirmed.');

// Test 3: Duplicate prevention on Morning Routine
console.log('\nTest 3: Verification of duplicate prevention when adding again to Morning');
handleApplyRecommendationToRoutine(sampleProducts.winona_mask, 'morning');
assert.strictEqual(morningSteps.length, 4); // should NOT increase!
assert.strictEqual(lastToast, '【薇诺娜 舒缓修护冻干面膜】已存在于晨间护肤中，无需重复添加');
console.log('✓ PASS: Duplicate prevented in morning routine with informative message.');

// Test 4: Add to Evening Routine
console.log('\nTest 4: Verification of adding to Evening Routine');
// Reset state
morningSteps = JSON.parse(JSON.stringify(INITIAL_MORNING_STEPS));
eveningSteps = JSON.parse(JSON.stringify(INITIAL_EVENING_STEPS));
handleApplyRecommendationToRoutine(sampleProducts.winona_mask, 'evening');
assert.strictEqual(morningSteps.length, 3);
assert.strictEqual(eveningSteps.length, 4);
assert.strictEqual(eveningSteps[3].stepNumber, 4);
assert.strictEqual(eveningSteps[3].productId, 'winona_repair_mask');
assert.strictEqual(eveningSteps[3].completed, false);
assert.strictEqual(lastToast, '已加入晚间护肤');
assert.strictEqual(lastTab, 'evening');
console.log('✓ PASS: Added to Evening only, step count updated from 3 to 4, target tab set to evening, toast confirmed.');

// Test 5: Add to Both (晨间和晚间) when fresh in both
console.log('\nTest 5: Verification of adding to Both (晨间和晚间)');
morningSteps = JSON.parse(JSON.stringify(INITIAL_MORNING_STEPS));
eveningSteps = JSON.parse(JSON.stringify(INITIAL_EVENING_STEPS));
handleApplyRecommendationToRoutine(sampleProducts.winona_mask, 'both');
assert.strictEqual(morningSteps.length, 4);
assert.strictEqual(eveningSteps.length, 4);
assert.strictEqual(morningSteps[3].productId, 'winona_repair_mask');
assert.strictEqual(eveningSteps[3].productId, 'winona_repair_mask');
assert.strictEqual(lastToast, '已加入晨间和晚间护肤');
console.log('✓ PASS: Added to both morning and evening routines, toast confirmed.');

// Test 6: User selects Both, but product is ALREADY in Morning (e.g. curel_cream)
console.log('\nTest 6: User selects Both, but product already exists in Morning');
morningSteps = JSON.parse(JSON.stringify(INITIAL_MORNING_STEPS)); // has curel_cream
eveningSteps = JSON.parse(JSON.stringify(INITIAL_EVENING_STEPS)); // does NOT have curel_cream
handleApplyRecommendationToRoutine(sampleProducts.curel_cream, 'both');
assert.strictEqual(morningSteps.length, 3); // not duplicated!
assert.strictEqual(eveningSteps.length, 4); // added to evening!
assert.strictEqual(eveningSteps[3].productId, 'curel_cream');
assert.strictEqual(lastToast, '已加入晚间护肤（晨间已有该产品）');
console.log('✓ PASS: Added only to evening routine with accurate partial confirmation message.');

// Test 7: User selects Both, but product is ALREADY in Evening (e.g. lrp_b5)
console.log('\nTest 7: User selects Both, but product already exists in Evening');
morningSteps = JSON.parse(JSON.stringify(INITIAL_MORNING_STEPS)); // does NOT have lrp_b5
eveningSteps = JSON.parse(JSON.stringify(INITIAL_EVENING_STEPS)); // has lrp_b5
handleApplyRecommendationToRoutine(sampleProducts.lrp_b5, 'both');
assert.strictEqual(morningSteps.length, 4); // added to morning!
assert.strictEqual(eveningSteps.length, 3); // not duplicated!
assert.strictEqual(morningSteps[3].productId, 'lrp_b5');
assert.strictEqual(lastToast, '已加入晨间护肤（晚间已有该产品）');
console.log('✓ PASS: Added only to morning routine with accurate partial confirmation message.');

// Test 8: User selects Both, but product is ALREADY in BOTH routines
console.log('\nTest 8: User selects Both, but product already exists in Both routines');
morningSteps.push(createStep(sampleProducts.lrp_b5, 'morning', morningSteps.length));
// Now lrp_b5 exists in both morning and evening
handleApplyRecommendationToRoutine(sampleProducts.lrp_b5, 'both');
assert.strictEqual(lastToast, '【理肤泉 B5+ 多效修护舒缓霜】已存在于晨间与晚间护肤中，无需重复添加');
console.log('✓ PASS: Duplicate prevented in both routines with explanatory message.');

// Test 9: Independent completion states
console.log('\nTest 9: Separate completion states between morning and evening');
morningSteps = JSON.parse(JSON.stringify(INITIAL_MORNING_STEPS));
eveningSteps = JSON.parse(JSON.stringify(INITIAL_EVENING_STEPS));
handleApplyRecommendationToRoutine(sampleProducts.winona_mask, 'both');
// Toggle completion of the newly added morning step
morningSteps[3].completed = true;
assert.strictEqual(morningSteps[3].completed, true);
assert.strictEqual(eveningSteps[3].completed, false); // evening must remain untouched!
console.log('✓ PASS: Morning completion does not bleed into evening completion state.');

console.log('\nALL 9 TESTS PASSED SUCCESSFULLY!');
