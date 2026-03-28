SMC logic 

// This work is licensed under a Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0) https://creativecommons.org/licenses/by-nc-sa/4.0/
// © LuxAlgo

//@version=5
indicator('Smart Money Concepts [LuxAlgo]', 'LuxAlgo - Smart Money Concepts', overlay = true, max_labels_count = 500, max_lines_count = 500, max_boxes_count = 500)
//---------------------------------------------------------------------------------------------------------------------}
//CONSTANTS & STRINGS & INPUTS
//---------------------------------------------------------------------------------------------------------------------{
BULLISH_LEG                     = 1
BEARISH_LEG                     = 0

BULLISH                         = +1
BEARISH                         = -1

GREEN                           = #089981
RED                             = #F23645
BLUE                            = #2157f3
GRAY                            = #878b94
MONO_BULLISH                    = #b2b5be
MONO_BEARISH                    = #5d606b

HISTORICAL                      = 'Historical'
PRESENT                         = 'Present'

COLORED                         = 'Colored'
MONOCHROME                      = 'Monochrome'

ALL                             = 'All'
BOS                             = 'BOS'
CHOCH                           = 'CHoCH'

TINY                            = size.tiny
SMALL                           = size.small
NORMAL                          = size.normal

ATR                             = 'Atr'
RANGE                           = 'Cumulative Mean Range'

CLOSE                           = 'Close'
HIGHLOW                         = 'High/Low'

SOLID                           = '⎯⎯⎯'
DASHED                          = '----'
DOTTED                          = '····'

SMART_GROUP                     = 'Smart Money Concepts'
INTERNAL_GROUP                  = 'Real Time Internal Structure'
SWING_GROUP                     = 'Real Time Swing Structure'
BLOCKS_GROUP                    = 'Order Blocks'
EQUAL_GROUP                     = 'EQH/EQL'
GAPS_GROUP                      = 'Fair Value Gaps'
LEVELS_GROUP                    = 'Highs & Lows MTF'
ZONES_GROUP                     = 'Premium & Discount Zones'

modeTooltip                     = 'Allows to display historical Structure or only the recent ones'
styleTooltip                    = 'Indicator color theme'
showTrendTooltip                = 'Display additional candles with a color reflecting the current trend detected by structure'
showInternalsTooltip            = 'Display internal market structure'
internalFilterConfluenceTooltip = 'Filter non significant internal structure breakouts'
showStructureTooltip            = 'Display swing market Structure'
showSwingsTooltip               = 'Display swing point as labels on the chart'
showHighLowSwingsTooltip        = 'Highlight most recent strong and weak high/low points on the chart'
showInternalOrderBlocksTooltip  = 'Display internal order blocks on the chart\n\nNumber of internal order blocks to display on the chart'
showSwingOrderBlocksTooltip     = 'Display swing order blocks on the chart\n\nNumber of internal swing blocks to display on the chart'
orderBlockFilterTooltip         = 'Method used to filter out volatile order blocks \n\nIt is recommended to use the cumulative mean range method when a low amount of data is available'
orderBlockMitigationTooltip     = 'Select what values to use for order block mitigation'
showEqualHighsLowsTooltip       = 'Display equal highs and equal lows on the chart'
equalHighsLowsLengthTooltip     = 'Number of bars used to confirm equal highs and equal lows'
equalHighsLowsThresholdTooltip  = 'Sensitivity threshold in a range (0, 1) used for the detection of equal highs & lows\n\nLower values will return fewer but more pertinent results'
showFairValueGapsTooltip        = 'Display fair values gaps on the chart'
fairValueGapsThresholdTooltip   = 'Filter out non significant fair value gaps'
fairValueGapsTimeframeTooltip   = 'Fair value gaps timeframe'
fairValueGapsExtendTooltip      = 'Determine how many bars to extend the Fair Value Gap boxes on chart'
showPremiumDiscountZonesTooltip = 'Display premium, discount, and equilibrium zones on chart'

modeInput                       = input.string( HISTORICAL, 'Mode',                     group = SMART_GROUP,    tooltip = modeTooltip, options = [HISTORICAL, PRESENT])
styleInput                      = input.string( COLORED,    'Style',                    group = SMART_GROUP,    tooltip = styleTooltip,options = [COLORED, MONOCHROME])
showTrendInput                  = input(        false,      'Color Candles',            group = SMART_GROUP,    tooltip = showTrendTooltip)

showInternalsInput              = input(        true,       'Show Internal Structure',  group = INTERNAL_GROUP, tooltip = showInternalsTooltip)
showInternalBullInput           = input.string( ALL,        'Bullish Structure',        group = INTERNAL_GROUP, inline = 'ibull', options = [ALL,BOS,CHOCH])
internalBullColorInput          = input(        GREEN,      '',                         group = INTERNAL_GROUP, inline = 'ibull')
showInternalBearInput           = input.string( ALL,        'Bearish Structure' ,       group = INTERNAL_GROUP, inline = 'ibear', options = [ALL,BOS,CHOCH])
internalBearColorInput          = input(        RED,        '',                         group = INTERNAL_GROUP, inline = 'ibear')
internalFilterConfluenceInput   = input(        false,      'Confluence Filter',        group = INTERNAL_GROUP, tooltip = internalFilterConfluenceTooltip)
internalStructureSize           = input.string( TINY,       'Internal Label Size',      group = INTERNAL_GROUP, options = [TINY,SMALL,NORMAL])

showStructureInput              = input(        true,       'Show Swing Structure',     group = SWING_GROUP,    tooltip = showStructureTooltip)
showSwingBullInput              = input.string( ALL,        'Bullish Structure',        group = SWING_GROUP,    inline = 'bull',    options = [ALL,BOS,CHOCH])
swingBullColorInput             = input(        GREEN,      '',                         group = SWING_GROUP,    inline = 'bull')
showSwingBearInput              = input.string( ALL,        'Bearish Structure',        group = SWING_GROUP,    inline = 'bear',    options = [ALL,BOS,CHOCH])
swingBearColorInput             = input(        RED,        '',                         group = SWING_GROUP,    inline = 'bear')
swingStructureSize              = input.string( SMALL,      'Swing Label Size',         group = SWING_GROUP,    options = [TINY,SMALL,NORMAL])
showSwingsInput                 = input(        false,      'Show Swings Points',       group = SWING_GROUP,    tooltip = showSwingsTooltip,inline = 'swings')
swingsLengthInput               = input.int(    50,         '',                         group = SWING_GROUP,    minval = 10,                inline = 'swings')
showHighLowSwingsInput          = input(        true,       'Show Strong/Weak High/Low',group = SWING_GROUP,    tooltip = showHighLowSwingsTooltip)

showInternalOrderBlocksInput    = input(        true,       'Internal Order Blocks' ,   group = BLOCKS_GROUP,   tooltip = showInternalOrderBlocksTooltip,   inline = 'iob')
internalOrderBlocksSizeInput    = input.int(    5,          '',                         group = BLOCKS_GROUP,   minval = 1, maxval = 20,                    inline = 'iob')
showSwingOrderBlocksInput       = input(        false,      'Swing Order Blocks',       group = BLOCKS_GROUP,   tooltip = showSwingOrderBlocksTooltip,      inline = 'ob')
swingOrderBlocksSizeInput       = input.int(    5,          '',                         group = BLOCKS_GROUP,   minval = 1, maxval = 20,                    inline = 'ob') 
orderBlockFilterInput           = input.string( 'Atr',      'Order Block Filter',       group = BLOCKS_GROUP,   tooltip = orderBlockFilterTooltip,          options = [ATR, RANGE])
orderBlockMitigationInput       = input.string( HIGHLOW,    'Order Block Mitigation',   group = BLOCKS_GROUP,   tooltip = orderBlockMitigationTooltip,      options = [CLOSE,HIGHLOW])
internalBullishOrderBlockColor  = input.color(color.new(#3179f5, 80), 'Internal Bullish OB',    group = BLOCKS_GROUP)
internalBearishOrderBlockColor  = input.color(color.new(#f77c80, 80), 'Internal Bearish OB',    group = BLOCKS_GROUP)
swingBullishOrderBlockColor     = input.color(color.new(#1848cc, 80), 'Bullish OB',             group = BLOCKS_GROUP)
swingBearishOrderBlockColor     = input.color(color.new(#b22833, 80), 'Bearish OB',             group = BLOCKS_GROUP)

showEqualHighsLowsInput         = input(        true,       'Equal High/Low',           group = EQUAL_GROUP,    tooltip = showEqualHighsLowsTooltip)
equalHighsLowsLengthInput       = input.int(    3,          'Bars Confirmation',        group = EQUAL_GROUP,    tooltip = equalHighsLowsLengthTooltip,      minval = 1)
equalHighsLowsThresholdInput    = input.float(  0.1,        'Threshold',                group = EQUAL_GROUP,    tooltip = equalHighsLowsThresholdTooltip,   minval = 0, maxval = 0.5, step = 0.1)
equalHighsLowsSizeInput         = input.string( TINY,       'Label Size',               group = EQUAL_GROUP,    options = [TINY,SMALL,NORMAL])

showFairValueGapsInput          = input(        false,      'Fair Value Gaps',          group = GAPS_GROUP,     tooltip = showFairValueGapsTooltip)
fairValueGapsThresholdInput     = input(        true,       'Auto Threshold',           group = GAPS_GROUP,     tooltip = fairValueGapsThresholdTooltip)
fairValueGapsTimeframeInput     = input.timeframe('',       'Timeframe',                group = GAPS_GROUP,     tooltip = fairValueGapsTimeframeTooltip)
fairValueGapsBullColorInput     = input.color(color.new(#00ff68, 70), 'Bullish FVG' , group = GAPS_GROUP)
fairValueGapsBearColorInput     = input.color(color.new(#ff0008, 70), 'Bearish FVG' , group = GAPS_GROUP)
fairValueGapsExtendInput        = input.int(    1,          'Extend FVG',               group = GAPS_GROUP,     tooltip = fairValueGapsExtendTooltip,       minval = 0)

showDailyLevelsInput            = input(        false,      'Daily',    group = LEVELS_GROUP,   inline = 'daily')
dailyLevelsStyleInput           = input.string( SOLID,      '',         group = LEVELS_GROUP,   inline = 'daily',   options = [SOLID,DASHED,DOTTED])
dailyLevelsColorInput           = input(        BLUE,       '',         group = LEVELS_GROUP,   inline = 'daily')
showWeeklyLevelsInput           = input(        false,      'Weekly',   group = LEVELS_GROUP,   inline = 'weekly')
weeklyLevelsStyleInput          = input.string( SOLID,      '',         group = LEVELS_GROUP,   inline = 'weekly',  options = [SOLID,DASHED,DOTTED])
weeklyLevelsColorInput          = input(        BLUE,       '',         group = LEVELS_GROUP,   inline = 'weekly')
showMonthlyLevelsInput          = input(        false,      'Monthly',   group = LEVELS_GROUP,   inline = 'monthly')
monthlyLevelsStyleInput         = input.string( SOLID,      '',         group = LEVELS_GROUP,   inline = 'monthly', options = [SOLID,DASHED,DOTTED])
monthlyLevelsColorInput         = input(        BLUE,       '',         group = LEVELS_GROUP,   inline = 'monthly')

showPremiumDiscountZonesInput   = input(        false,      'Premium/Discount Zones',   group = ZONES_GROUP , tooltip = showPremiumDiscountZonesTooltip)
premiumZoneColorInput           = input.color(  RED,        'Premium Zone',             group = ZONES_GROUP)
equilibriumZoneColorInput       = input.color(  GRAY,       'Equilibrium Zone',         group = ZONES_GROUP)
discountZoneColorInput          = input.color(  GREEN,      'Discount Zone',            group = ZONES_GROUP)

//---------------------------------------------------------------------------------------------------------------------}
//DATA STRUCTURES & VARIABLES
//---------------------------------------------------------------------------------------------------------------------{
// @type                            UDT representing alerts as bool fields
// @field internalBullishBOS        internal structure custom alert
// @field internalBearishBOS        internal structure custom alert
// @field internalBullishCHoCH      internal structure custom alert
// @field internalBearishCHoCH      internal structure custom alert
// @field swingBullishBOS           swing structure custom alert
// @field swingBearishBOS           swing structure custom alert
// @field swingBullishCHoCH         swing structure custom alert
// @field swingBearishCHoCH         swing structure custom alert
// @field internalBullishOrderBlock internal order block custom alert
// @field internalBearishOrderBlock internal order block custom alert
// @field swingBullishOrderBlock    swing order block custom alert
// @field swingBearishOrderBlock    swing order block custom alert
// @field equalHighs                equal high low custom alert
// @field equalLows                 equal high low custom alert
// @field bullishFairValueGap       fair value gap custom alert
// @field bearishFairValueGap       fair value gap custom alert
type alerts
    bool internalBullishBOS         = false
    bool internalBearishBOS         = false
    bool internalBullishCHoCH       = false
    bool internalBearishCHoCH       = false
    bool swingBullishBOS            = false
    bool swingBearishBOS            = false
    bool swingBullishCHoCH          = false
    bool swingBearishCHoCH          = false
    bool internalBullishOrderBlock  = false
    bool internalBearishOrderBlock  = false
    bool swingBullishOrderBlock     = false
    bool swingBearishOrderBlock     = false
    bool equalHighs                 = false
    bool equalLows                  = false
    bool bullishFairValueGap        = false
    bool bearishFairValueGap        = false

// @type                            UDT representing last swing extremes (top & bottom)
// @field top                       last top swing price
// @field bottom                    last bottom swing price
// @field barTime                   last swing bar time
// @field barIndex                  last swing bar index
// @field lastTopTime               last top swing time
// @field lastBottomTime            last bottom swing time
type trailingExtremes
    float top
    float bottom
    int barTime
    int barIndex
    int lastTopTime
    int lastBottomTime

// @type                            UDT representing Fair Value Gaps
// @field top                       top price
// @field bottom                    bottom price
// @field bias                      bias (BULLISH or BEARISH)
// @field topBox                    top box
// @field bottomBox                 bottom box
type fairValueGap
    float top
    float bottom
    int bias
    box topBox
    box bottomBox

// @type                            UDT representing trend bias
// @field bias                      BULLISH or BEARISH
type trend
    int bias    

// @type                            UDT representing Equal Highs Lows display
// @field l_ine                     displayed line
// @field l_abel                    displayed label
type equalDisplay
    line l_ine      = na
    label l_abel    = na

// @type                            UDT representing a pivot point (swing point) 
// @field currentLevel              current price level
// @field lastLevel                 last price level
// @field crossed                   true if price level is crossed
// @field barTime                   bar time
// @field barIndex                  bar index    
type pivot
    float currentLevel
    float lastLevel
    bool crossed
    int barTime     = time
    int barIndex    = bar_index

// @type                            UDT representing an order block
// @field barHigh                   bar high
// @field barLow                    bar low
// @field barTime                   bar time
// @field bias                      BULLISH or BEARISH
type orderBlock
    float barHigh
    float barLow
    int barTime    
    int bias

// @variable                        current swing pivot high    
var pivot swingHigh                 = pivot.new(na,na,false)
// @variable                        current swing pivot low
var pivot swingLow                  = pivot.new(na,na,false)
// @variable                        current internal pivot high
var pivot internalHigh              = pivot.new(na,na,false)
// @variable                        current internal pivot low
var pivot internalLow               = pivot.new(na,na,false)
// @variable                        current equal high pivot
var pivot equalHigh                 = pivot.new(na,na,false)
// @variable                        current equal low pivot
var pivot equalLow                  = pivot.new(na,na,false)
// @variable                        swing trend bias
var trend swingTrend                = trend.new(0)
// @variable                        internal trend bias
var trend internalTrend             = trend.new(0)
// @variable                        equal high display
var equalDisplay equalHighDisplay   = equalDisplay.new()
// @variable                        equal low display
var equalDisplay equalLowDisplay    = equalDisplay.new()
// @variable                        storage for fairValueGap UDTs
var array<fairValueGap> fairValueGaps = array.new<fairValueGap>()
// @variable                        storage for parsed highs
var array<float> parsedHighs        = array.new<float>()
// @variable                        storage for parsed lows
var array<float> parsedLows         = array.new<float>()
// @variable                        storage for raw highs
var array<float> highs              = array.new<float>()
// @variable                        storage for raw lows
var array<float> lows               = array.new<float>()
// @variable                        storage for bar time values
var array<int> times                = array.new<int>()
// @variable                        last trailing swing high and low
var trailingExtremes trailing       = trailingExtremes.new()
// @variable                                storage for orderBlock UDTs (swing order blocks)
var array<orderBlock> swingOrderBlocks      = array.new<orderBlock>()
// @variable                                storage for orderBlock UDTs (internal order blocks)
var array<orderBlock> internalOrderBlocks   = array.new<orderBlock>()
// @variable                                storage for swing order blocks boxes
var array<box> swingOrderBlocksBoxes        = array.new<box>()
// @variable                                storage for internal order blocks boxes
var array<box> internalOrderBlocksBoxes     = array.new<box>()
// @variable                        color for swing bullish structures
var swingBullishColor               = styleInput == MONOCHROME ? MONO_BULLISH : swingBullColorInput
// @variable                        color for swing bearish structures
var swingBearishColor               = styleInput == MONOCHROME ? MONO_BEARISH : swingBearColorInput
// @variable                        color for bullish fair value gaps
var fairValueGapBullishColor        = styleInput == MONOCHROME ? color.new(MONO_BULLISH,70) : fairValueGapsBullColorInput
// @variable                        color for bearish fair value gaps
var fairValueGapBearishColor        = styleInput == MONOCHROME ? color.new(MONO_BEARISH,70) : fairValueGapsBearColorInput
// @variable                        color for premium zone
var premiumZoneColor                = styleInput == MONOCHROME ? MONO_BEARISH : premiumZoneColorInput
// @variable                        color for discount zone
var discountZoneColor               = styleInput == MONOCHROME ? MONO_BULLISH : discountZoneColorInput 
// @variable                        bar index on current script iteration
varip int currentBarIndex           = bar_index
// @variable                        bar index on last script iteration
varip int lastBarIndex              = bar_index
// @variable                        alerts in current bar
alerts currentAlerts                = alerts.new()
// @variable                        time at start of chart
var initialTime                     = time

// we create the needed boxes for displaying order blocks at the first execution
if barstate.isfirst
    if showSwingOrderBlocksInput
        for index = 1 to swingOrderBlocksSizeInput
            swingOrderBlocksBoxes.push(box.new(na,na,na,na,xloc = xloc.bar_time,extend = extend.right))
    if showInternalOrderBlocksInput
        for index = 1 to internalOrderBlocksSizeInput
            internalOrderBlocksBoxes.push(box.new(na,na,na,na,xloc = xloc.bar_time,extend = extend.right))

// @variable                        source to use in bearish order blocks mitigation
bearishOrderBlockMitigationSource   = orderBlockMitigationInput == CLOSE ? close : high
// @variable                        source to use in bullish order blocks mitigation
bullishOrderBlockMitigationSource   = orderBlockMitigationInput == CLOSE ? close : low
// @variable                        default volatility measure
atrMeasure                          = ta.atr(200)
// @variable                        parsed volatility measure by user settings
volatilityMeasure                   = orderBlockFilterInput == ATR ? atrMeasure : ta.cum(ta.tr)/bar_index
// @variable                        true if current bar is a high volatility bar
highVolatilityBar                   = (high - low) >= (2 * volatilityMeasure)
// @variable                        parsed high
parsedHigh                          = highVolatilityBar ? low : high
// @variable                        parsed low
parsedLow                           = highVolatilityBar ? high : low

// we store current values into the arrays at each bar
parsedHighs.push(parsedHigh)
parsedLows.push(parsedLow)
highs.push(high)
lows.push(low)
times.push(time)

//---------------------------------------------------------------------------------------------------------------------}
//USER-DEFINED FUNCTIONS
//---------------------------------------------------------------------------------------------------------------------{
// @function            Get the value of the current leg, it can be 0 (bearish) or 1 (bullish)
// @returns             int
leg(int size) =>
    var leg     = 0    
    newLegHigh  = high[size] > ta.highest( size)
    newLegLow   = low[size]  < ta.lowest(  size)
    
    if newLegHigh
        leg := BEARISH_LEG
    else if newLegLow
        leg := BULLISH_LEG
    leg

// @function            Identify whether the current value is the start of a new leg (swing)
// @param leg           (int) Current leg value
// @returns             bool
startOfNewLeg(int leg)      => ta.change(leg) != 0

// @function            Identify whether the current level is the start of a new bearish leg (swing)
// @param leg           (int) Current leg value
// @returns             bool
startOfBearishLeg(int leg)  => ta.change(leg) == -1

// @function            Identify whether the current level is the start of a new bullish leg (swing)
// @param leg           (int) Current leg value
// @returns             bool
startOfBullishLeg(int leg)  => ta.change(leg) == +1

// @function            create a new label
// @param labelTime     bar time coordinate
// @param labelPrice    price coordinate
// @param tag           text to display
// @param labelColor    text color
// @param labelStyle    label style
// @returns             label ID
drawLabel(int labelTime, float labelPrice, string tag, color labelColor, string labelStyle) =>    
    var label l_abel = na

    if modeInput == PRESENT
        l_abel.delete()

    l_abel := label.new(chart.point.new(labelTime,na,labelPrice),tag,xloc.bar_time,color=color(na),textcolor=labelColor,style = labelStyle,size = size.small)

// @function            create a new line and label representing an EQH or EQL
// @param p_ivot        starting pivot
// @param level         price level of current pivot
// @param size          how many bars ago was the current pivot detected
// @param equalHigh     true for EQH, false for EQL
// @returns             label ID
drawEqualHighLow(pivot p_ivot, float level, int size, bool equalHigh) =>
    equalDisplay e_qualDisplay = equalHigh ? equalHighDisplay : equalLowDisplay
    
    string tag          = 'EQL'
    color equalColor    = swingBullishColor
    string labelStyle   = label.style_label_up

    if equalHigh
        tag         := 'EQH'
        equalColor  := swingBearishColor
        labelStyle  := label.style_label_down

    if modeInput == PRESENT
        line.delete(    e_qualDisplay.l_ine)
        label.delete(   e_qualDisplay.l_abel)
        
    e_qualDisplay.l_ine     := line.new(chart.point.new(p_ivot.barTime,na,p_ivot.currentLevel), chart.point.new(time[size],na,level), xloc = xloc.bar_time, color = equalColor, style = line.style_dotted)
    labelPosition           = math.round(0.5*(p_ivot.barIndex + bar_index - size))
    e_qualDisplay.l_abel    := label.new(chart.point.new(na,labelPosition,level), tag, xloc.bar_index, color = color(na), textcolor = equalColor, style = labelStyle, size = equalHighsLowsSizeInput)

// @function            store current structure and trailing swing points, and also display swing points and equal highs/lows
// @param size          (int) structure size
// @param equalHighLow  (bool) true for displaying current highs/lows
// @param internal      (bool) true for getting internal structures
// @returns             label ID
getCurrentStructure(int size,bool equalHighLow = false, bool internal = false) =>        
    currentLeg              = leg(size)
    newPivot                = startOfNewLeg(currentLeg)
    pivotLow                = startOfBullishLeg(currentLeg)
    pivotHigh               = startOfBearishLeg(currentLeg)

    if newPivot
        if pivotLow
            pivot p_ivot    = equalHighLow ? equalLow : internal ? internalLow : swingLow    

            if equalHighLow and math.abs(p_ivot.currentLevel - low[size]) < equalHighsLowsThresholdInput * atrMeasure                
                drawEqualHighLow(p_ivot, low[size], size, false)
                currentAlerts.equalLows := true

            p_ivot.lastLevel    := p_ivot.currentLevel
            p_ivot.currentLevel := low[size]
            p_ivot.crossed      := false
            p_ivot.barTime      := time[size]
            p_ivot.barIndex     := bar_index[size]

            if not equalHighLow and not internal
                trailing.bottom         := p_ivot.currentLevel
                trailing.barTime        := p_ivot.barTime
                trailing.barIndex       := p_ivot.barIndex
                trailing.lastBottomTime := p_ivot.barTime

            if showSwingsInput and not internal and not equalHighLow
                drawLabel(time[size], p_ivot.currentLevel, p_ivot.currentLevel < p_ivot.lastLevel ? 'LL' : 'HL', swingBullishColor, label.style_label_up)            
        else
            pivot p_ivot = equalHighLow ? equalHigh : internal ? internalHigh : swingHigh

            if equalHighLow and math.abs(p_ivot.currentLevel - high[size]) < equalHighsLowsThresholdInput * atrMeasure
                drawEqualHighLow(p_ivot,high[size],size,true)
                currentAlerts.equalHighs := true               

            p_ivot.lastLevel    := p_ivot.currentLevel
            p_ivot.currentLevel := high[size]
            p_ivot.crossed      := false
            p_ivot.barTime      := time[size]
            p_ivot.barIndex     := bar_index[size]

            if not equalHighLow and not internal
                trailing.top            := p_ivot.currentLevel
                trailing.barTime        := p_ivot.barTime
                trailing.barIndex       := p_ivot.barIndex
                trailing.lastTopTime    := p_ivot.barTime

            if showSwingsInput and not internal and not equalHighLow
                drawLabel(time[size], p_ivot.currentLevel, p_ivot.currentLevel > p_ivot.lastLevel ? 'HH' : 'LH', swingBearishColor, label.style_label_down)
                
// @function                draw line and label representing a structure
// @param p_ivot            base pivot point
// @param tag               test to display
// @param structureColor    base color
// @param lineStyle         line style
// @param labelStyle        label style
// @param labelSize         text size
// @returns                 label ID
drawStructure(pivot p_ivot, string tag, color structureColor, string lineStyle, string labelStyle, string labelSize) =>    
    var line l_ine      = line.new(na,na,na,na,xloc = xloc.bar_time)
    var label l_abel    = label.new(na,na)

    if modeInput == PRESENT
        l_ine.delete()
        l_abel.delete()

    l_ine   := line.new(chart.point.new(p_ivot.barTime,na,p_ivot.currentLevel), chart.point.new(time,na,p_ivot.currentLevel), xloc.bar_time, color=structureColor, style=lineStyle)
    l_abel  := label.new(chart.point.new(na,math.round(0.5*(p_ivot.barIndex+bar_index)),p_ivot.currentLevel), tag, xloc.bar_index, color=color(na), textcolor=structureColor, style=labelStyle, size = labelSize)

// @function            delete order blocks
// @param internal      true for internal order blocks
// @returns             orderBlock ID
deleteOrderBlocks(bool internal = false) =>
    array<orderBlock> orderBlocks = internal ? internalOrderBlocks : swingOrderBlocks

    for [index,eachOrderBlock] in orderBlocks
        bool crossedOderBlock = false
        
        if bearishOrderBlockMitigationSource > eachOrderBlock.barHigh and eachOrderBlock.bias == BEARISH
            crossedOderBlock := true
            if internal
                currentAlerts.internalBearishOrderBlock := true
            else
                currentAlerts.swingBearishOrderBlock    := true
        else if bullishOrderBlockMitigationSource < eachOrderBlock.barLow and eachOrderBlock.bias == BULLISH
            crossedOderBlock := true
            if internal
                currentAlerts.internalBullishOrderBlock := true
            else
                currentAlerts.swingBullishOrderBlock    := true
        if crossedOderBlock                    
            orderBlocks.remove(index)            

// @function            fetch and store order blocks
// @param p_ivot        base pivot point
// @param internal      true for internal order blocks
// @param bias          BULLISH or BEARISH
// @returns             void
storeOrdeBlock(pivot p_ivot,bool internal = false,int bias) =>
    if (not internal and showSwingOrderBlocksInput) or (internal and showInternalOrderBlocksInput)

        array<float> a_rray = na
        int parsedIndex = na

        if bias == BEARISH
            a_rray      := parsedHighs.slice(p_ivot.barIndex,bar_index)
            parsedIndex := p_ivot.barIndex + a_rray.indexof(a_rray.max())  
        else
            a_rray      := parsedLows.slice(p_ivot.barIndex,bar_index)
            parsedIndex := p_ivot.barIndex + a_rray.indexof(a_rray.min())                        

        orderBlock o_rderBlock          = orderBlock.new(parsedHighs.get(parsedIndex), parsedLows.get(parsedIndex), times.get(parsedIndex),bias)
        array<orderBlock> orderBlocks   = internal ? internalOrderBlocks : swingOrderBlocks
        
        if orderBlocks.size() >= 100
            orderBlocks.pop()
        orderBlocks.unshift(o_rderBlock)

// @function            draw order blocks as boxes
// @param internal      true for internal order blocks
// @returns             void
drawOrderBlocks(bool internal = false) =>        
    array<orderBlock> orderBlocks = internal ? internalOrderBlocks : swingOrderBlocks
    orderBlocksSize = orderBlocks.size()

    if orderBlocksSize > 0        
        maxOrderBlocks                      = internal ? internalOrderBlocksSizeInput : swingOrderBlocksSizeInput
        array<orderBlock> parsedOrdeBlocks  = orderBlocks.slice(0, math.min(maxOrderBlocks,orderBlocksSize))
        array<box> b_oxes                   = internal ? internalOrderBlocksBoxes : swingOrderBlocksBoxes        

        for [index,eachOrderBlock] in parsedOrdeBlocks
            orderBlockColor = styleInput == MONOCHROME ? (eachOrderBlock.bias == BEARISH ? color.new(MONO_BEARISH,80) : color.new(MONO_BULLISH,80)) : internal ? (eachOrderBlock.bias == BEARISH ? internalBearishOrderBlockColor : internalBullishOrderBlockColor) : (eachOrderBlock.bias == BEARISH ? swingBearishOrderBlockColor : swingBullishOrderBlockColor)

            box b_ox        = b_oxes.get(index)
            b_ox.set_top_left_point(    chart.point.new(eachOrderBlock.barTime,na,eachOrderBlock.barHigh))
            b_ox.set_bottom_right_point(chart.point.new(last_bar_time,na,eachOrderBlock.barLow))        
            b_ox.set_border_color(      internal ? na : orderBlockColor)
            b_ox.set_bgcolor(           orderBlockColor)

// @function            detect and draw structures, also detect and store order blocks
// @param internal      true for internal structures or order blocks
// @returns             void
displayStructure(bool internal = false) =>
    var bullishBar = true
    var bearishBar = true

    if internalFilterConfluenceInput
        bullishBar := high - math.max(close, open) > math.min(close, open - low)
        bearishBar := high - math.max(close, open) < math.min(close, open - low)
    
    pivot p_ivot    = internal ? internalHigh : swingHigh
    trend t_rend    = internal ? internalTrend : swingTrend

    lineStyle       = internal ? line.style_dashed : line.style_solid
    labelSize       = internal ? internalStructureSize : swingStructureSize

    extraCondition  = internal ? internalHigh.currentLevel != swingHigh.currentLevel and bullishBar : true
    bullishColor    = styleInput == MONOCHROME ? MONO_BULLISH : internal ? internalBullColorInput : swingBullColorInput

    if ta.crossover(close,p_ivot.currentLevel) and not p_ivot.crossed and extraCondition
        string tag = t_rend.bias == BEARISH ? CHOCH : BOS

        if internal
            currentAlerts.internalBullishCHoCH  := tag == CHOCH
            currentAlerts.internalBullishBOS    := tag == BOS
        else
            currentAlerts.swingBullishCHoCH     := tag == CHOCH
            currentAlerts.swingBullishBOS       := tag == BOS

        p_ivot.crossed  := true
        t_rend.bias     := BULLISH

        displayCondition = internal ? showInternalsInput and (showInternalBullInput == ALL or (showInternalBullInput == BOS and tag != CHOCH) or (showInternalBullInput == CHOCH and tag == CHOCH)) : showStructureInput and (showSwingBullInput == ALL or (showSwingBullInput == BOS and tag != CHOCH) or (showSwingBullInput == CHOCH and tag == CHOCH))

        if displayCondition                        
            drawStructure(p_ivot,tag,bullishColor,lineStyle,label.style_label_down,labelSize)

        if (internal and showInternalOrderBlocksInput) or (not internal and showSwingOrderBlocksInput)
            storeOrdeBlock(p_ivot,internal,BULLISH)

    p_ivot          := internal ? internalLow : swingLow    
    extraCondition  := internal ? internalLow.currentLevel != swingLow.currentLevel and bearishBar : true
    bearishColor    = styleInput == MONOCHROME ? MONO_BEARISH : internal ? internalBearColorInput : swingBearColorInput

    if ta.crossunder(close,p_ivot.currentLevel) and not p_ivot.crossed and extraCondition
        string tag = t_rend.bias == BULLISH ? CHOCH : BOS

        if internal
            currentAlerts.internalBearishCHoCH  := tag == CHOCH
            currentAlerts.internalBearishBOS    := tag == BOS
        else
            currentAlerts.swingBearishCHoCH     := tag == CHOCH
            currentAlerts.swingBearishBOS       := tag == BOS

        p_ivot.crossed := true
        t_rend.bias := BEARISH

        displayCondition = internal ? showInternalsInput and (showInternalBearInput == ALL or (showInternalBearInput == BOS and tag != CHOCH) or (showInternalBearInput == CHOCH and tag == CHOCH)) : showStructureInput and (showSwingBearInput == ALL or (showSwingBearInput == BOS and tag != CHOCH) or (showSwingBearInput == CHOCH and tag == CHOCH))
        
        if displayCondition                        
            drawStructure(p_ivot,tag,bearishColor,lineStyle,label.style_label_up,labelSize)

        if (internal and showInternalOrderBlocksInput) or (not internal and showSwingOrderBlocksInput)
            storeOrdeBlock(p_ivot,internal,BEARISH)

// @function            draw one fair value gap box (each fair value gap has two boxes)
// @param leftTime      left time coordinate
// @param rightTime     right time coordinate
// @param topPrice      top price level
// @param bottomPrice   bottom price level
// @param boxColor      box color
// @returns             box ID
fairValueGapBox(leftTime,rightTime,topPrice,bottomPrice,boxColor) => box.new(chart.point.new(leftTime,na,topPrice),chart.point.new(rightTime + fairValueGapsExtendInput * (time-time[1]),na,bottomPrice), xloc=xloc.bar_time, border_color = boxColor, bgcolor = boxColor)

// @function            delete fair value gaps
// @returns             fairValueGap ID
deleteFairValueGaps() =>
    for [index,eachFairValueGap] in fairValueGaps
        if (low < eachFairValueGap.bottom and eachFairValueGap.bias == BULLISH) or (high > eachFairValueGap.top and eachFairValueGap.bias == BEARISH)
            eachFairValueGap.topBox.delete()
            eachFairValueGap.bottomBox.delete()
            fairValueGaps.remove(index)
    
// @function            draw fair value gaps
// @returns             fairValueGap ID
drawFairValueGaps() => 
    [lastClose, lastOpen, lastTime, currentHigh, currentLow, currentTime, last2High, last2Low] = request.security(syminfo.tickerid, fairValueGapsTimeframeInput, [close[1], open[1], time[1], high[0], low[0], time[0], high[2], low[2]],lookahead = barmerge.lookahead_on)

    barDeltaPercent     = (lastClose - lastOpen) / (lastOpen * 100)
    newTimeframe        = timeframe.change(fairValueGapsTimeframeInput)
    threshold           = fairValueGapsThresholdInput ? ta.cum(math.abs(newTimeframe ? barDeltaPercent : 0)) / bar_index * 2 : 0

    bullishFairValueGap = currentLow > last2High and lastClose > last2High and barDeltaPercent > threshold and newTimeframe
    bearishFairValueGap = currentHigh < last2Low and lastClose < last2Low and -barDeltaPercent > threshold and newTimeframe

    if bullishFairValueGap
        currentAlerts.bullishFairValueGap := true
        fairValueGaps.unshift(fairValueGap.new(currentLow,last2High,BULLISH,fairValueGapBox(lastTime,currentTime,currentLow,math.avg(currentLow,last2High),fairValueGapBullishColor),fairValueGapBox(lastTime,currentTime,math.avg(currentLow,last2High),last2High,fairValueGapBullishColor)))
    if bearishFairValueGap
        currentAlerts.bearishFairValueGap := true
        fairValueGaps.unshift(fairValueGap.new(currentHigh,last2Low,BEARISH,fairValueGapBox(lastTime,currentTime,currentHigh,math.avg(currentHigh,last2Low),fairValueGapBearishColor),fairValueGapBox(lastTime,currentTime,math.avg(currentHigh,last2Low),last2Low,fairValueGapBearishColor)))

// @function            get line style from string
// @param style         line style
// @returns             string
getStyle(string style) =>
    switch style
        SOLID => line.style_solid
        DASHED => line.style_dashed
        DOTTED => line.style_dotted

// @function            draw MultiTimeFrame levels
// @param timeframe     base timeframe
// @param sameTimeframe true if chart timeframe is same as base timeframe
// @param style         line style
// @param levelColor    line and text color
// @returns             void
drawLevels(string timeframe, bool sameTimeframe, string style, color levelColor) =>
    [topLevel, bottomLevel, leftTime, rightTime] = request.security(syminfo.tickerid, timeframe, [high[1], low[1], time[1], time],lookahead = barmerge.lookahead_on)

    float parsedTop         = sameTimeframe ? high : topLevel
    float parsedBottom      = sameTimeframe ? low : bottomLevel    

    int parsedLeftTime      = sameTimeframe ? time : leftTime
    int parsedRightTime     = sameTimeframe ? time : rightTime

    int parsedTopTime       = time
    int parsedBottomTime    = time

    if not sameTimeframe
        int leftIndex               = times.binary_search_rightmost(parsedLeftTime)
        int rightIndex              = times.binary_search_rightmost(parsedRightTime)

        array<int> timeArray        = times.slice(leftIndex,rightIndex)
        array<float> topArray       = highs.slice(leftIndex,rightIndex)
        array<float> bottomArray    = lows.slice(leftIndex,rightIndex)

        parsedTopTime               := timeArray.size() > 0 ? timeArray.get(topArray.indexof(topArray.max())) : initialTime
        parsedBottomTime            := timeArray.size() > 0 ? timeArray.get(bottomArray.indexof(bottomArray.min())) : initialTime

    var line topLine        = line.new(na, na, na, na, xloc = xloc.bar_time, color = levelColor, style = getStyle(style))
    var line bottomLine     = line.new(na, na, na, na, xloc = xloc.bar_time, color = levelColor, style = getStyle(style))
    var label topLabel      = label.new(na, na, xloc = xloc.bar_time, text = str.format('P{0}H',timeframe), color=color(na), textcolor = levelColor, size = size.small, style = label.style_label_left)
    var label bottomLabel   = label.new(na, na, xloc = xloc.bar_time, text = str.format('P{0}L',timeframe), color=color(na), textcolor = levelColor, size = size.small, style = label.style_label_left)

    topLine.set_first_point(    chart.point.new(parsedTopTime,na,parsedTop))
    topLine.set_second_point(   chart.point.new(last_bar_time + 20 * (time-time[1]),na,parsedTop))   
    topLabel.set_point(         chart.point.new(last_bar_time + 20 * (time-time[1]),na,parsedTop))

    bottomLine.set_first_point( chart.point.new(parsedBottomTime,na,parsedBottom))    
    bottomLine.set_second_point(chart.point.new(last_bar_time + 20 * (time-time[1]),na,parsedBottom))
    bottomLabel.set_point(      chart.point.new(last_bar_time + 20 * (time-time[1]),na,parsedBottom))

// @function            true if chart timeframe is higher than provided timeframe
// @param timeframe     timeframe to check
// @returns             bool
higherTimeframe(string timeframe) => timeframe.in_seconds() > timeframe.in_seconds(timeframe)

// @function            update trailing swing points
// @returns             int
updateTrailingExtremes() =>
    trailing.top            := math.max(high,trailing.top)
    trailing.lastTopTime    := trailing.top == high ? time : trailing.lastTopTime
    trailing.bottom         := math.min(low,trailing.bottom)
    trailing.lastBottomTime := trailing.bottom == low ? time : trailing.lastBottomTime

// @function            draw trailing swing points
// @returns             void
drawHighLowSwings() =>
    var line topLine        = line.new(na, na, na, na, color = swingBearishColor, xloc = xloc.bar_time)
    var line bottomLine     = line.new(na, na, na, na, color = swingBullishColor, xloc = xloc.bar_time)
    var label topLabel      = label.new(na, na, color=color(na), textcolor = swingBearishColor, xloc = xloc.bar_time, style = label.style_label_down, size = size.tiny)
    var label bottomLabel   = label.new(na, na, color=color(na), textcolor = swingBullishColor, xloc = xloc.bar_time, style = label.style_label_up, size = size.tiny)

    rightTimeBar            = last_bar_time + 20 * (time - time[1])

    topLine.set_first_point(    chart.point.new(trailing.lastTopTime, na, trailing.top))
    topLine.set_second_point(   chart.point.new(rightTimeBar, na, trailing.top))
    topLabel.set_point(         chart.point.new(rightTimeBar, na, trailing.top))
    topLabel.set_text(          swingTrend.bias == BEARISH ? 'Strong High' : 'Weak High')

    bottomLine.set_first_point( chart.point.new(trailing.lastBottomTime, na, trailing.bottom))
    bottomLine.set_second_point(chart.point.new(rightTimeBar, na, trailing.bottom))
    bottomLabel.set_point(      chart.point.new(rightTimeBar, na, trailing.bottom))
    bottomLabel.set_text(       swingTrend.bias == BULLISH ? 'Strong Low' : 'Weak Low')

// @function            draw a zone with a label and a box
// @param labelLevel    price level for label
// @param labelIndex    bar index for label
// @param top           top price level for box
// @param bottom        bottom price level for box
// @param tag           text to display
// @param zoneColor     base color
// @param style         label style
// @returns             void
drawZone(float labelLevel, int labelIndex, float top, float bottom, string tag, color zoneColor, string style) =>
    var label l_abel    = label.new(na,na,text = tag, color=color(na),textcolor = zoneColor, style = style, size = size.small)
    var box b_ox        = box.new(na,na,na,na,bgcolor = color.new(zoneColor,80),border_color = color(na), xloc = xloc.bar_time)

    b_ox.set_top_left_point(    chart.point.new(trailing.barTime,na,top))
    b_ox.set_bottom_right_point(chart.point.new(last_bar_time,na,bottom))

    l_abel.set_point(           chart.point.new(na,labelIndex,labelLevel))

// @function            draw premium/discount zones
// @returns             void
drawPremiumDiscountZones() =>
    drawZone(trailing.top, math.round(0.5*(trailing.barIndex + last_bar_index)), trailing.top, 0.95*trailing.top + 0.05*trailing.bottom, 'Premium', premiumZoneColor, label.style_label_down)

    equilibriumLevel = math.avg(trailing.top, trailing.bottom)
    drawZone(equilibriumLevel, last_bar_index, 0.525*trailing.top + 0.475*trailing.bottom, 0.525*trailing.bottom + 0.475*trailing.top, 'Equilibrium', equilibriumZoneColorInput, label.style_label_left)

    drawZone(trailing.bottom, math.round(0.5*(trailing.barIndex + last_bar_index)), 0.95*trailing.bottom + 0.05*trailing.top, trailing.bottom, 'Discount', discountZoneColor, label.style_label_up)

//---------------------------------------------------------------------------------------------------------------------}
//MUTABLE VARIABLES & EXECUTION
//---------------------------------------------------------------------------------------------------------------------{
parsedOpen  = showTrendInput ? open : na
candleColor = internalTrend.bias == BULLISH ? swingBullishColor : swingBearishColor
plotcandle(parsedOpen,high,low,close,color = candleColor, wickcolor = candleColor, bordercolor = candleColor)

if showHighLowSwingsInput or showPremiumDiscountZonesInput
    updateTrailingExtremes()

    if showHighLowSwingsInput
        drawHighLowSwings()

    if showPremiumDiscountZonesInput
        drawPremiumDiscountZones()

if showFairValueGapsInput
    deleteFairValueGaps()

getCurrentStructure(swingsLengthInput,false)
getCurrentStructure(5,false,true)

if showEqualHighsLowsInput
    getCurrentStructure(equalHighsLowsLengthInput,true)

if showInternalsInput or showInternalOrderBlocksInput or showTrendInput
    displayStructure(true)

if showStructureInput or showSwingOrderBlocksInput or showHighLowSwingsInput
    displayStructure()

if showInternalOrderBlocksInput
    deleteOrderBlocks(true)

if showSwingOrderBlocksInput
    deleteOrderBlocks()

if showFairValueGapsInput
    drawFairValueGaps()

if barstate.islastconfirmedhistory or barstate.islast
    if showInternalOrderBlocksInput        
        drawOrderBlocks(true)
        
    if showSwingOrderBlocksInput        
        drawOrderBlocks()

lastBarIndex    := currentBarIndex
currentBarIndex := bar_index
newBar          = currentBarIndex != lastBarIndex

if barstate.islastconfirmedhistory or (barstate.isrealtime and newBar)
    if showDailyLevelsInput and not higherTimeframe('D')
        drawLevels('D',timeframe.isdaily,dailyLevelsStyleInput,dailyLevelsColorInput)

    if showWeeklyLevelsInput and not higherTimeframe('W')
        drawLevels('W',timeframe.isweekly,weeklyLevelsStyleInput,weeklyLevelsColorInput)

    if showMonthlyLevelsInput and not higherTimeframe('M')
        drawLevels('M',timeframe.ismonthly,monthlyLevelsStyleInput,monthlyLevelsColorInput)

//---------------------------------------------------------------------------------------------------------------------}
//ALERTS
//---------------------------------------------------------------------------------------------------------------------{
alertcondition(currentAlerts.internalBullishBOS,        'Internal Bullish BOS',         'Internal Bullish BOS formed')
alertcondition(currentAlerts.internalBullishCHoCH,      'Internal Bullish CHoCH',       'Internal Bullish CHoCH formed')
alertcondition(currentAlerts.internalBearishBOS,        'Internal Bearish BOS',         'Internal Bearish BOS formed')
alertcondition(currentAlerts.internalBearishCHoCH,      'Internal Bearish CHoCH',       'Internal Bearish CHoCH formed')

alertcondition(currentAlerts.swingBullishBOS,           'Bullish BOS',                  'Internal Bullish BOS formed')
alertcondition(currentAlerts.swingBullishCHoCH,         'Bullish CHoCH',                'Internal Bullish CHoCH formed')
alertcondition(currentAlerts.swingBearishBOS,           'Bearish BOS',                  'Bearish BOS formed')
alertcondition(currentAlerts.swingBearishCHoCH,         'Bearish CHoCH',                'Bearish CHoCH formed')

alertcondition(currentAlerts.internalBullishOrderBlock, 'Bullish Internal OB Breakout', 'Price broke bullish internal OB')
alertcondition(currentAlerts.internalBearishOrderBlock, 'Bearish Internal OB Breakout', 'Price broke bearish internal OB')
alertcondition(currentAlerts.swingBullishOrderBlock,    'Bullish Swing OB Breakout',    'Price broke bullish swing OB')
alertcondition(currentAlerts.swingBearishOrderBlock,    'Bearish Swing OB Breakout',    'Price broke bearish swing OB')

alertcondition(currentAlerts.equalHighs,                'Equal Highs',                  'Equal highs detected')
alertcondition(currentAlerts.equalLows,                 'Equal Lows',                   'Equal lows detected')

alertcondition(currentAlerts.bullishFairValueGap,       'Bullish FVG',                  'Bullish FVG formed')
alertcondition(currentAlerts.bearishFairValueGap,       'Bearish FVG',                  'Bearish FVG formed')

//---------------------------------------------------------------------------------------------------------------------}







Pivot logic 


//@version=6
indicator("Pivot Points Standard", "Pivots", overlay=true, max_lines_count=500, max_labels_count=500)

pivotTypeInput           = input.string(title="Type", defval="Traditional", options=["Traditional", "Fibonacci", "Woodie", "Classic", "DM", "Camarilla"])
pivotAnchorInput         = input.string(title="Pivots Timeframe", defval="Auto", options=["Auto", "Daily", "Weekly", "Monthly", "Quarterly", "Yearly", "Biyearly", "Triyearly", "Quinquennially", "Decennially"])
maxHistoricalPivotsInput = input.int(title="Number of Pivots Back", defval=15, minval=1, maxval=200, display = display.data_window)
isDailyBasedInput        = input.bool(title="Use Daily-based Values", defval=true, display = display.data_window, tooltip="When this option is unchecked, Pivot Points will use intraday data while calculating on intraday charts. If Extended Hours are displayed on the chart, they will be taken into account during the pivot level calculation. If intraday OHLC values are different from daily-based values (normal for stocks), the pivot levels will also differ.")
showLabelsInput          = input.bool(title="Show Labels", defval=true, group="labels", display = display.data_window)
showPricesInput          = input.bool(title="Show Prices", defval=true, group="labels", display = display.data_window)
positionLabelsInput      = input.string("Left", "Labels Position", options=["Left", "Right"], group="labels", display = display.data_window, active = showLabelsInput or showPricesInput)
linewidthInput           = input.int(title="Line Width", defval=1, minval=1, maxval=100, group="levels", display = display.data_window)

DEFAULT_COLOR = #FB8C00

showLevel2and3 = pivotTypeInput != "DM"
showLevel4 = pivotTypeInput != "DM" and pivotTypeInput != "Fibonacci"
showLevel5 = pivotTypeInput == "Traditional" or pivotTypeInput == "Camarilla"

pColorInput = input.color(DEFAULT_COLOR, "P‏  ‏  ‏", inline="P", group="levels", display = display.data_window)
pShowInput = input.bool(true, "", inline="P", group="levels", display = display.data_window)
s1ColorInput = input.color(DEFAULT_COLOR, "S1", inline="S1/R1" , group="levels", display = display.data_window)
s1ShowInput = input.bool(true, "", inline="S1/R1", group="levels", display = display.data_window)
r1ColorInput = input.color(DEFAULT_COLOR, "‏  ‏  ‏  ‏  ‏  ‏  ‏  ‏R1", inline="S1/R1", group="levels", display = display.data_window)
r1ShowInput = input.bool(true, "", inline="S1/R1", group="levels", display = display.data_window)
s2ColorInput = input.color(DEFAULT_COLOR, "S2", inline="S2/R2", group="levels", display = display.data_window, active = showLevel2and3)
s2ShowInput = input.bool(true, "", inline="S2/R2", group="levels", display = display.data_window, active = showLevel2and3)
r2ColorInput = input.color(DEFAULT_COLOR, "‏  ‏  ‏  ‏  ‏  ‏  ‏  ‏R2", inline="S2/R2", group="levels", display = display.data_window, active = showLevel2and3)
r2ShowInput = input.bool(true, "", inline="S2/R2", group="levels", display = display.data_window, active = showLevel2and3)
s3ColorInput = input.color(DEFAULT_COLOR, "S3", inline="S3/R3", group="levels", display = display.data_window, active = showLevel2and3)
s3ShowInput = input.bool(true, "", inline="S3/R3", group="levels", display = display.data_window, active = showLevel2and3)
r3ColorInput = input.color(DEFAULT_COLOR, "‏  ‏  ‏  ‏  ‏  ‏  ‏  ‏R3", inline="S3/R3", group="levels", display = display.data_window, active = showLevel2and3)
r3ShowInput = input.bool(true, "", inline="S3/R3", group="levels", display = display.data_window, active = showLevel2and3)
s4ColorInput = input.color(DEFAULT_COLOR, "S4", inline="S4/R4", group="levels", display = display.data_window, active = showLevel4)
s4ShowInput = input.bool(true, "", inline="S4/R4", group="levels", display = display.data_window, active = showLevel4)
r4ColorInput = input.color(DEFAULT_COLOR, "‏  ‏  ‏  ‏  ‏  ‏  ‏  ‏R4", inline="S4/R4", group="levels", display = display.data_window, active = showLevel4)
r4ShowInput = input.bool(true, "", inline="S4/R4", group="levels", display = display.data_window, active = showLevel4)
s5ColorInput = input.color(DEFAULT_COLOR, "S5", inline="S5/R5", group="levels", display = display.data_window, active = showLevel5)
s5ShowInput = input.bool(true, "", inline="S5/R5", group="levels", display = display.data_window, active = showLevel5)
r5ColorInput = input.color(DEFAULT_COLOR, "‏  ‏  ‏  ‏  ‏  ‏  ‏  ‏R5", inline="S5/R5", group="levels", display = display.data_window, active = showLevel5)
r5ShowInput = input.bool(true, "", inline="S5/R5", group="levels", display = display.data_window, active = showLevel5)

type graphicSettings
    string levelName
    color levelColor
    bool showLevel

var graphicSettingsArray = array.from(
      graphicSettings.new(" P", pColorInput, pShowInput),
      graphicSettings.new("R1", r1ColorInput, r1ShowInput), graphicSettings.new("S1", s1ColorInput, s1ShowInput),
      graphicSettings.new("R2", r2ColorInput, r2ShowInput), graphicSettings.new("S2", s2ColorInput, s2ShowInput),
      graphicSettings.new("R3", r3ColorInput, r3ShowInput), graphicSettings.new("S3", s3ColorInput, s3ShowInput),
      graphicSettings.new("R4", r4ColorInput, r4ShowInput), graphicSettings.new("S4", s4ColorInput, s4ShowInput),
      graphicSettings.new("R5", r5ColorInput, r5ShowInput), graphicSettings.new("S5", s5ColorInput, s5ShowInput))

autoAnchor = switch
    timeframe.isintraday => timeframe.multiplier <= 15 ? "1D" : "1W"
    timeframe.isdaily    => "1M"
    => "12M"

pivotTimeframe = switch pivotAnchorInput
    "Auto"      => autoAnchor
    "Daily"     => "1D"
    "Weekly"    => "1W"
    "Monthly"   => "1M"
    "Quarterly" => "3M"
    => "12M"

//@variable The number of years in the selected Pivot period
pivotYearMultiplier = switch pivotAnchorInput
    "Biyearly"       => 2
    "Triyearly"      => 3
    "Quinquennially" => 5
    "Decennially"    => 10
    => 1

//@variable The number of values in the pivots of the selected type
numOfPivotLevels = switch pivotTypeInput
    "Traditional" => 11
    "Camarilla"   => 11
    "Woodie"      => 9
    "Classic"     => 9
    "Fibonacci"   => 7
    "DM"          => 3

type pivotGraphic
    line pivotLine
    label pivotLabel

method delete(pivotGraphic graphic) =>
    graphic.pivotLine.delete()
    graphic.pivotLabel.delete()

var drawnGraphics = matrix.new<pivotGraphic>()

localPivotTimeframeChange = timeframe.change(pivotTimeframe) and year % pivotYearMultiplier == 0
securityPivotTimeframeChange = timeframe.change(timeframe.period) and year % pivotYearMultiplier == 0

pivotTimeframeChangeCounter(condition) => 
    var count = 0
    if condition and bar_index > 0
        count += 1
    count

localPivots = ta.pivot_point_levels(pivotTypeInput, localPivotTimeframeChange)
securityPivotPointsArray = ta.pivot_point_levels(pivotTypeInput, securityPivotTimeframeChange)

securityTimeframe = timeframe.isintraday ? "1D" : timeframe.period
[securityPivots, securityPivotCounter] = request.security(syminfo.tickerid, pivotTimeframe, [securityPivotPointsArray, pivotTimeframeChangeCounter(securityPivotTimeframeChange)], lookahead = barmerge.lookahead_on)
pivotPointsArray = isDailyBasedInput ? securityPivots : localPivots

//@function Sets the ending points of the currently active pivots to `endTime`.
affixOldPivots(endTime) =>
    if drawnGraphics.rows() > 0
        lastGraphics = drawnGraphics.row(drawnGraphics.rows() - 1)

        for graphic in lastGraphics
            graphic.pivotLine.set_x2(endTime)
            if positionLabelsInput == "Right"
                graphic.pivotLabel.set_x(endTime)

//@function Draws pivot lines and labels from `startTime` to the approximate end of the period.
drawNewPivots(startTime) =>
    
    newGraphics = array.new<pivotGraphic>()

    for [index, coord] in pivotPointsArray
        levelSettings = graphicSettingsArray.get(index)
        if not na(coord) and levelSettings.showLevel
            lineEndTime = startTime + timeframe.in_seconds(pivotTimeframe) * 1000 * pivotYearMultiplier
            pivotLine = line.new(startTime, coord, lineEndTime, coord, xloc = xloc.bar_time, color=levelSettings.levelColor, width=linewidthInput)
            pivotLabel = label.new(x = positionLabelsInput == "Left" ? startTime : lineEndTime,
                               y = coord,
                               text = (showLabelsInput ? levelSettings.levelName + " " : "") + (showPricesInput ? "(" + str.tostring(coord, format.mintick) + ")" : ""),
                               style = positionLabelsInput == "Left" ? label.style_label_right : label.style_label_left,
                               textcolor = levelSettings.levelColor,
                               color = #00000000,
                               xloc=xloc.bar_time)
            
            newGraphics.push(pivotGraphic.new(pivotLine, pivotLabel))
    
    drawnGraphics.add_row(array_id = newGraphics)

    if drawnGraphics.rows() > maxHistoricalPivotsInput
        oldGraphics = drawnGraphics.remove_row(0)
        
        for graphic in oldGraphics
            graphic.delete()


localPivotDrawConditionStatic = not isDailyBasedInput and localPivotTimeframeChange
securityPivotDrawConditionStatic = isDailyBasedInput and securityPivotCounter != securityPivotCounter[1]

var isMultiYearly = array.from("Biyearly", "Triyearly", "Quinquennially", "Decennially").includes(pivotAnchorInput)
localPivotDrawConditionDeveloping = not isDailyBasedInput and time_close == time_close(pivotTimeframe) and not isMultiYearly 
securityPivotDrawConditionDeveloping = false

if (securityPivotDrawConditionStatic or localPivotDrawConditionStatic)
    affixOldPivots(time)
    drawNewPivots(time)

// If possible, draw pivots from the beginning of the chart if none were found
var FIRST_BAR_TIME = time
if (barstate.islastconfirmedhistory and drawnGraphics.columns() == 0)

    if not na(securityPivots) and securityPivotCounter > 0
        if isDailyBasedInput
            drawNewPivots(FIRST_BAR_TIME)
        else 
            runtime.error("Not enough intraday data to calculate Pivot Points. Lower the Pivots Timeframe or turn on the 'Use Daily-based Values' option in the indicator settings.")
    else
        runtime.error("Not enough data to calculate Pivot Points. Lower the Pivots Timeframe in the indicator settings.")






Sessions logic 

// This work is licensed under a Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0) https://creativecommons.org/licenses/by-nc-sa/4.0/
// © LuxAlgo

//@version=5
indicator("Sessions [LuxAlgo]", "LuxAlgo - Sessions", overlay = true, max_bars_back = 500, max_lines_count = 500, max_boxes_count = 500, max_labels_count = 500)
//------------------------------------------------------------------------------
//Settings
//-----------------------------------------------------------------------------{
//Session A
show_sesa = input(true, '', inline = 'sesa', group = 'Session A')
sesa_txt = input('New York', '', inline = 'sesa', group = 'Session A')
sesa_ses = input.session('1300-2200', '', inline = 'sesa', group = 'Session A')
sesa_css = input.color(#ff5d00, '', inline = 'sesa', group = 'Session A')

sesa_range = input(true, 'Range', inline = 'sesa_overlays', group = 'Session A')
sesa_tl = input(false, 'Trendline', inline = 'sesa_overlays', group = 'Session A')
sesa_avg = input(false, 'Mean', inline = 'sesa_overlays', group = 'Session A')
sesa_vwap = input(false, 'VWAP', inline = 'sesa_overlays', group = 'Session A')
sesa_maxmin = input(false, 'Max/Min', inline = 'sesa_overlays', group = 'Session A')

//Session B
show_sesb = input(true, '', inline = 'sesb', group = 'Session B')
sesb_txt = input('London', '', inline = 'sesb', group = 'Session B')
sesb_ses = input.session('0700-1600', '', inline = 'sesb', group = 'Session B')
sesb_css = input.color(#2157f3, '', inline = 'sesb', group = 'Session B')

sesb_range = input(true, 'Range', inline = 'sesb_overlays', group = 'Session B')
sesb_tl = input(false, 'Trendline', inline = 'sesb_overlays', group = 'Session B')
sesb_avg = input(false, 'Mean', inline = 'sesb_overlays', group = 'Session B')
sesb_vwap = input(false, 'VWAP', inline = 'sesb_overlays', group = 'Session B')
sesb_maxmin = input(false, 'Max/Min', inline = 'sesb_overlays', group = 'Session B')

//Session C
show_sesc = input(true, '', inline = 'sesc', group = 'Session C')
sesc_txt = input('Tokyo', '', inline = 'sesc', group = 'Session C')
sesc_ses = input.session('0000-0900', '', inline = 'sesc', group = 'Session C')
sesc_css = input.color(#e91e63, '', inline = 'sesc', group = 'Session C')

sesc_range = input(true, 'Range', inline = 'sesc_overlays', group = 'Session C')
sesc_tl = input(false, 'Trendline', inline = 'sesc_overlays', group = 'Session C')
sesc_avg = input(false, 'Mean', inline = 'sesc_overlays', group = 'Session C')
sesc_vwap = input(false, 'VWAP', inline = 'sesc_overlays', group = 'Session C')
sesc_maxmin = input(false, 'Max/Min', inline = 'sesc_overlays', group = 'Session C')

//Session D
show_sesd = input(true, '', inline = 'sesd', group = 'Session D')
sesd_txt = input('Sydney', '', inline = 'sesd', group = 'Session D')
sesd_ses = input.session('2100-0600', '', inline = 'sesd', group = 'Session D')
sesd_css = input.color(#ffeb3b, '', inline = 'sesd', group = 'Session D')

sesd_range = input(true, 'Range', inline = 'sesd_overlays', group = 'Session D')
sesd_tl = input(false, 'Trendline', inline = 'sesd_overlays', group = 'Session D')
sesd_avg = input(false, 'Mean', inline = 'sesd_overlays', group = 'Session D')
sesd_vwap = input(false, 'VWAP', inline = 'sesd_overlays', group = 'Session D')
sesd_maxmin = input(false, 'Max/Min', inline = 'sesd_overlays', group = 'Session D')

//Timezones
tz_incr = input.int(0, 'UTC (+/-)', group = 'Timezone')
use_exchange = input(false, 'Use Exchange Timezone', group = 'Timezone')

//Ranges Options
bg_transp = input.float(90, 'Range Area Transparency', group = 'Ranges Settings')
show_outline = input(true, 'Range Outline', group = 'Ranges Settings')
show_txt = input(true, 'Range Label', group = 'Ranges Settings')

//Dashboard
show_dash = input(false, 'Show Dashboard', group   = 'Dashboard')
advanced_dash = input(false, 'Advanced Dashboard', group = 'Dashboard')
dash_loc = input.string('Top Right', 'Dashboard Location', options = ['Top Right', 'Bottom Right', 'Bottom Left'], group   = 'Dashboard')
text_size = input.string('Small', 'Dashboard Size', options = ['Tiny', 'Small', 'Normal'], group   = 'Dashboard')

//Divider
show_ses_div = input(false, 'Show Sessions Divider', group = 'Dividers')
show_day_div = input(true, 'Show Daily Divider', group = 'Dividers')

//-----------------------------------------------------------------------------}
//Functions
//-----------------------------------------------------------------------------{
n = bar_index

//Get session average
get_avg(session)=>
    var len = 1
    var float csma = na
    var float sma = na

    if session > session[1]
        len := 1
        csma := close
    
    if session and session == session[1]
        len += 1    
        csma += close
        sma := csma / len
    
    sma

//Get trendline coordinates
get_linreg(session)=>
    var len = 1
    var float cwma  = na
    var float csma  = na
    var float csma2 = na

    var float y1 = na
    var float y2 = na
    var float stdev = na 
    var float r2    = na 

    if session > session[1]
        len   := 1
        cwma  := close
        csma  := close
        csma2 := close * close
    
    if session and session == session[1]
        len   += 1    
        csma  += close
        csma2 += close * close
        cwma  += close * len

        sma = csma / len
        wma = cwma / (len * (len + 1) / 2)

        cov   = (wma - sma) * (len+1)/2
        stdev := math.sqrt(csma2 / len - sma * sma)
        r2    := cov / (stdev * (math.sqrt(len*len - 1) / (2 * math.sqrt(3))))

        y1 := 4 * sma - 3 * wma
        y2 := 3 * wma - 2 * sma

    [y1 , y2, stdev, r2]

//Session Vwap
get_vwap(session) =>
    var float num = na
    var float den = na

    if session > session[1]
        num := close * volume
        den := volume
    
    else if session and session == session[1]
        num += close * volume
        den += volume
    else
        num := na

    [num, den]

//Set line
set_line(session, y1, y2, session_css)=>
    var line tl = na

    if session > session[1]
        tl := line.new(n, close, n, close, color = session_css)

    if session and session == session[1]
        line.set_y1(tl, y1)
        line.set_xy2(tl, n, y2)

//Set session range
get_range(session, session_name, session_css)=>
    var t = 0 
    var max = high
    var min = low
    var box bx = na
    var label lbl = na 
    
    if session > session[1]
        t := time
        max := high
        min := low

        bx := box.new(n, max, n, min
          , bgcolor = color.new(session_css, bg_transp)
          , border_color = show_outline ? session_css : na
          , border_style = line.style_dotted)

        if show_txt
            lbl := label.new(t, max, session_name
              , xloc = xloc.bar_time
              , textcolor = session_css
              , style = label.style_label_down
              , color = color.new(color.white, 100)
              , size = size.tiny)

    if session and session == session[1]
        max := math.max(high, max)
        min := math.min(low, min)

        box.set_top(bx, max)
        box.set_rightbottom(bx, n, min)

        if show_txt
            label.set_xy(lbl, int(math.avg(t, time)), max)
    
    [session ? na : max, session ? na : min]

//-----------------------------------------------------------------------------}
//Sessions
//-----------------------------------------------------------------------------{
tf = timeframe.period

var tz = use_exchange ? syminfo.timezone :
  str.format('UTC{0}{1}', tz_incr >= 0 ? '+' : '-', math.abs(tz_incr))

is_sesa = math.sign(nz(time(tf, sesa_ses, tz)))
is_sesb = math.sign(nz(time(tf, sesb_ses, tz)))
is_sesc = math.sign(nz(time(tf, sesc_ses, tz)))
is_sesd = math.sign(nz(time(tf, sesd_ses, tz)))

//-----------------------------------------------------------------------------}
//Dashboard
//-----------------------------------------------------------------------------{
var table_position = dash_loc == 'Bottom Left' ? position.bottom_left 
  : dash_loc == 'Top Right' ? position.top_right 
  : position.bottom_right

var table_size = text_size == 'Tiny' ? size.tiny 
  : text_size == 'Small' ? size.small 
  : size.normal

var tb = table.new(table_position, 5, 6
  , bgcolor = #1e222d
  , border_color = #373a46
  , border_width = 1
  , frame_color = #373a46
  , frame_width = 1)

if barstate.isfirst and show_dash
    table.cell(tb, 0, 0, 'LuxAlgo', text_color = color.white, text_size = table_size)
    table.merge_cells(tb, 0, 0, 4, 0)

    table.cell(tb, 0, 2, sesa_txt, text_color = sesa_css, text_size = table_size)
    table.cell(tb, 0, 3, sesb_txt, text_color = sesb_css, text_size = table_size)
    table.cell(tb, 0, 4, sesc_txt, text_color = sesc_css, text_size = table_size)
    table.cell(tb, 0, 5, sesd_txt, text_color = sesd_css, text_size = table_size)

    if advanced_dash
        table.cell(tb, 0, 1, 'Session', text_color = color.white
          , text_size = table_size)
        
        table.cell(tb, 1, 1, 'Status', text_color = color.white
          , text_size = table_size)
        
        table.cell(tb, 2, 1, 'Trend', text_color = color.white
          , text_size = table_size)
        
        table.cell(tb, 3, 1, 'Volume', text_color = color.white
          , text_size = table_size)
        
        table.cell(tb, 4, 1, 'σ', text_color = color.white
          , text_size = table_size)

if barstate.islast and show_dash
    table.cell(tb, 1, 2, is_sesa ? 'Active' : 'Innactive'
      , bgcolor = is_sesa ? #089981 : #f23645
      , text_color = color.white
      , text_size = table_size)
    
    table.cell(tb, 1, 3, is_sesb ? 'Active' : 'Innactive'
      , bgcolor = is_sesb ? #089981 : #f23645
      , text_color = color.white
      , text_size = table_size)
    
    table.cell(tb, 1, 4, is_sesc ? 'Active' : 'Innactive'
      , bgcolor = is_sesc ? #089981 : #f23645
      , text_color = color.white
      , text_size = table_size)
    
    table.cell(tb, 1, 5, is_sesd ? 'Active' : 'Innactive'
      , bgcolor = is_sesd ? #089981 : #f23645
      , text_color = color.white
      , text_size = table_size)

//-----------------------------------------------------------------------------}
//Overlays
//-----------------------------------------------------------------------------{
var float max_sesa = na
var float min_sesa = na
var float max_sesb = na
var float min_sesb = na
var float max_sesc = na
var float min_sesc = na
var float max_sesd = na
var float min_sesd = na

//Ranges
if show_sesa and sesa_range
    [max, min] = get_range(is_sesa, sesa_txt, sesa_css)
    max_sesa := max
    min_sesa := min

if show_sesb and sesb_range
    [max, min] = get_range(is_sesb, sesb_txt, sesb_css)
    max_sesb := max
    min_sesb := min

if show_sesc and sesc_range
    [max, min] = get_range(is_sesc, sesc_txt, sesc_css)
    max_sesc := max
    min_sesc := min

if show_sesd and sesd_range
    [max, min] = get_range(is_sesd, sesd_txt, sesd_css)
    max_sesd := max
    min_sesd := min

//Trendlines
if show_sesa and (sesa_tl or advanced_dash)
    [y1, y2, stdev, r2] = get_linreg(is_sesa)

    if advanced_dash
        table.cell(tb, 2, 2, str.tostring(r2, '#.##')
          , bgcolor = r2 > 0 ? #089981 : #f23645
          , text_color = color.white
          , text_size = table_size)
        
        table.cell(tb, 4, 2, str.tostring(stdev, '#.####')
          , text_color = color.white
          , text_size = table_size)
        
    if sesa_tl
        set_line(is_sesa, y1, y2, sesa_css)

if show_sesb and (sesb_tl or advanced_dash)
    [y1, y2, stdev, r2] = get_linreg(is_sesb)
    
    if advanced_dash
        table.cell(tb, 2, 3, str.tostring(r2, '#.##')
          , bgcolor = r2 > 0 ? #089981 : #f23645
          , text_color = color.white
          , text_size = table_size)

        table.cell(tb, 4, 3, str.tostring(stdev, '#.####')
          , text_color = color.white
          , text_size = table_size)
        
    if sesb_tl
        set_line(is_sesb, y1, y2, sesb_css)

if show_sesc and (sesc_tl or advanced_dash)
    [y1, y2, stdev, r2] = get_linreg(is_sesc)
    
    if advanced_dash
        table.cell(tb, 2, 4, str.tostring(r2, '#.##')
          , bgcolor = r2 > 0 ? #089981 : #f23645
          , text_color = color.white
          , text_size = table_size)

        table.cell(tb, 4, 4, str.tostring(stdev, '#.####')
          , text_color = color.white
          , text_size = table_size)
        
    if sesc_tl
        set_line(is_sesc, y1, y2, sesc_css)

if show_sesd and (sesd_tl or advanced_dash)
    [y1, y2, stdev, r2] = get_linreg(is_sesd)
    
    if advanced_dash
        table.cell(tb, 2, 5, str.tostring(r2, '#.##')
          , bgcolor = r2 > 0 ? #089981 : #f23645
          , text_color = color.white
          , text_size = table_size)
        
        table.cell(tb, 4, 5, str.tostring(stdev, '#.####')
          , text_color = color.white
          , text_size = table_size)
        
    if sesd_tl
        set_line(is_sesd, y1, y2, sesd_css)

//Mean
if show_sesa and sesa_avg
    avg = get_avg(is_sesa)
    set_line(is_sesa, avg, avg, sesa_css)

if show_sesb and sesb_avg
    avg = get_avg(is_sesb)
    set_line(is_sesb, avg, avg, sesb_css)

if show_sesc and sesc_avg
    avg = get_avg(is_sesc)
    set_line(is_sesc, avg, avg, sesc_css)

if show_sesd and sesd_avg
    avg = get_avg(is_sesd)
    set_line(is_sesd, avg, avg, sesd_css)

//VWAP
var float vwap_a = na
var float vwap_b = na
var float vwap_c = na
var float vwap_d = na

if show_sesa and (sesa_vwap or advanced_dash)
    [num, den] = get_vwap(is_sesa)

    if sesa_vwap
        vwap_a := num / den

    if advanced_dash
        table.cell(tb, 3, 2, str.tostring(den, format.volume)
          , text_color = color.white
          , text_size = table_size)

if show_sesb and (sesb_vwap or advanced_dash)
    [num, den] = get_vwap(is_sesb)

    if sesb_vwap
        vwap_b := num / den

    if advanced_dash
        table.cell(tb, 3, 3, str.tostring(den, format.volume)
          , text_color = color.white
          , text_size = table_size)

if show_sesc and (sesc_vwap or advanced_dash)
    [num, den] = get_vwap(is_sesc)

    if sesc_vwap
        vwap_c := num / den

    if advanced_dash
        table.cell(tb, 3, 4, str.tostring(den, format.volume)
          , text_color = color.white
          , text_size = table_size)

if show_sesd and (sesd_vwap or advanced_dash)
    [num, den] = get_vwap(is_sesd)

    if sesd_vwap
        vwap_d := num / den

    if advanced_dash
        table.cell(tb, 3, 5, str.tostring(den, format.volume)
          , text_color = color.white
          , text_size = table_size)

//-----------------------------------------------------------------------------}
//Plots
//-----------------------------------------------------------------------------{
//Plot max/min
plot(sesa_maxmin ? max_sesa : na, 'Session A Maximum', sesa_css, 1, plot.style_linebr)
plot(sesa_maxmin ? min_sesa : na, 'Session A Minimum', sesa_css, 1, plot.style_linebr)

plot(sesb_maxmin ? max_sesb : na, 'Session B Maximum', sesb_css, 1, plot.style_linebr)
plot(sesb_maxmin ? min_sesb : na, 'Session B Minimum', sesb_css, 1, plot.style_linebr)

plot(sesc_maxmin ? max_sesc : na, 'Session C Maximum', sesc_css, 1, plot.style_linebr)
plot(sesc_maxmin ? min_sesc : na, 'Session C Minimum', sesc_css, 1, plot.style_linebr)

plot(sesd_maxmin ? max_sesd : na, 'Session D Maximum', sesd_css, 1, plot.style_linebr)
plot(sesd_maxmin ? min_sesd : na, 'Session D Minimum', sesd_css, 1, plot.style_linebr)

//Plot vwaps
plot(vwap_a, 'Session A VWAP', sesa_css, 1, plot.style_linebr)
plot(vwap_b, 'Session B VWAP', sesb_css, 1, plot.style_linebr)
plot(vwap_c, 'Session C VWAP', sesc_css, 1, plot.style_linebr)
plot(vwap_d, 'Session D VWAP', sesd_css, 1, plot.style_linebr)

//Plot Divider A
plotshape(is_sesa and show_ses_div and show_sesa, "·"
  , shape.square
  , location.bottom
  , na
  , text = "."
  , textcolor = sesa_css
  , size = size.tiny
  , display = display.all - display.status_line
  , editable = false)

plotshape(is_sesa != is_sesa[1] and show_ses_div and show_sesa, "NYE"
  , shape.labelup
  , location.bottom
  , na
  , text = "❚"
  , textcolor = sesa_css
  , size = size.tiny
  , display = display.all - display.status_line
  , editable = false)

//Plot Divider B
plotshape(is_sesb and show_ses_div and show_sesb, "·"
  , shape.labelup
  , location.bottom
  , na
  , text = "."
  , textcolor = sesb_css
  , size = size.tiny
  , display = display.all - display.status_line
  , editable = false)

plotshape(is_sesb != is_sesb[1] and show_ses_div and show_sesb, "LDN"
  , shape.labelup
  , location.bottom
  , na
  , text = "❚"
  , textcolor = sesb_css
  , size = size.tiny
  , display = display.all - display.status_line
  , editable = false)

//Plot Divider C
plotshape(is_sesc and show_ses_div and show_sesc, "·"
  , shape.square
  , location.bottom
  , na
  , text = "."
  , textcolor = sesc_css
  , size = size.tiny
  , display = display.all - display.status_line
  , editable = false)

plotshape(is_sesc != is_sesc[1] and show_ses_div and show_sesc, "TYO"
  , shape.labelup
  , location.bottom
  , na
  , text = "❚"
  , textcolor = sesc_css
  , size = size.tiny
  , display = display.all - display.status_line
  , editable = false)

//Plot Divider D
plotshape(is_sesd and show_ses_div and show_sesd, "·"
  , shape.labelup
  , location.bottom
  , na
  , text = "."
  , textcolor = sesd_css
  , size = size.tiny
  , display = display.all - display.status_line
  , editable = false)

plotshape(is_sesd != is_sesd[1] and show_ses_div and show_sesd, "SYD"
  , shape.labelup
  , location.bottom
  , na
  , text = "❚"
  , textcolor = sesd_css
  , size = size.tiny
  , display = display.all - display.status_line
  , editable = false)

//-----------------------------------------------------------------------------}
//Plots daily dividers
//-----------------------------------------------------------------------------{
day = dayofweek

if day != day[1] and show_day_div
    line.new(n, close + syminfo.mintick, n, close - syminfo.mintick
      , color  = color.gray
      , extend = extend.both
      , style  = line.style_dashed)

plotshape(day != day[1] and day == 1 and show_day_div, "Sunday"
  , shape.labeldown
  , location.top
  , na
  , text = "Sunday"
  , textcolor = color.gray
  , size = size.tiny
  , display = display.all - display.status_line
  , editable = false)

plotshape(day != day[1] and day == 2 and show_day_div, "Monday"
  , shape.labeldown
  , location.top
  , na
  , text = "Monday"
  , textcolor = color.gray
  , size = size.tiny
  , display = display.all - display.status_line
  , editable = false)

plotshape(day != day[1] and day == 3 and show_day_div, "Tuesday"
  , shape.labeldown
  , location.top
  , na
  , text = "Tuesday"
  , textcolor = color.gray
  , size = size.tiny
  , display = display.all - display.status_line
  , editable = false)

plotshape(day != day[1] and day == 4 and show_day_div, "Wednesay"
  , shape.labeldown
  , location.top
  , na
  , text = "Wednesday"
  , textcolor = color.gray
  , size = size.tiny
  , display = display.all - display.status_line
  , editable = false)

plotshape(day != day[1] and day == 5 and show_day_div, "Thursday"
  , shape.labeldown
  , location.top
  , na
  , text = "Thursday"
  , textcolor = color.gray
  , size = size.tiny
  , display = display.all - display.status_line
  , editable = false)

plotshape(day != day[1] and day == 6 and show_day_div, "Friday"
  , shape.labeldown
  , location.top
  , na
  , text = "Friday"
  , textcolor = color.gray
  , size = size.tiny
  , display = display.all - display.status_line
  , editable = false)

plotshape(day != day[1] and day == 7 and show_day_div, "Saturday"
  , shape.labeldown
  , location.top
  , na
  , text = "Saturday"
  , textcolor = color.gray
  , size = size.tiny
  , display = display.all - display.status_line
  , editable = false)

//-----------------------------------------------------------------------------}



elliot wave theory logic 

// This work is licensed under a Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0) https://creativecommons.org/licenses/by-nc-sa/4.0/
// © LuxAlgo

//@version=5
indicator("Elliott Wave [LuxAlgo]", max_lines_count=500, max_labels_count=500, overlay=true, max_bars_back=5000)
//------------------------------------------------------------------------------
//Settings
//-----------------------------------------------------------------------------{
i_hi  = input.string('high'        , title=        ''          , group='source [high - low]', inline='hl', options=['high', 'close', 'max open/close'])
i_lo  = input.string('low'         , title=        ''          , group='source [high - low]', inline='hl', options=['low' , 'close', 'min open/close'])

s1    = input.bool  (true          , title=        ''          , group='ZigZag'             , inline= '1'                                             )
len1  = input.int   ( 4            , title=        '  1 Length', group='ZigZag'             , inline= '1', minval =1                                  )
col1  = input.color (color.red   , title=        ''          , group='ZigZag'             , inline= '1'                                             )
s2    = input.bool  (true          , title=        ''          , group='ZigZag'             , inline= '2'                                             )
len2  = input.int   ( 8            , title=        '  2 Length', group='ZigZag'             , inline= '2', minval =1                                  )
col2  = input.color (color.blue  , title=        ''          , group='ZigZag'             , inline= '2'                                             )
s3    = input.bool  (true          , title=        ''          , group='ZigZag'             , inline= '3'                                             )                                           
len3  = input.int   (16            , title=        '  3 Length', group='ZigZag'             , inline= '3', minval =1                                  )
col3  = input.color (color.white , title=        ''          , group='ZigZag'             , inline= '3'                                             )


i_500 = input.float (0.500         , title='           level 1', group='Fibonacci values'   ,              minval =0, maxval =1, step =0.01           )
i_618 = input.float (0.618         , title='           level 2', group='Fibonacci values'   ,              minval =0, maxval =1, step =0.01           )
i_764 = input.float (0.764         , title='           level 3', group='Fibonacci values'   ,              minval =0, maxval =1, step =0.01           )
i_854 = input.float (0.854         , title='           level 4', group='Fibonacci values'   ,              minval =0, maxval =1, step =0.01           )

shZZ  = input.bool  (false         , title=         ''         , group='show ZZ'            , inline='zz'                                             )

//-----------------------------------------------------------------------------}
//User Defined Types
//-----------------------------------------------------------------------------{
type ZZ 
    int  [] d
    int  [] x 
    float[] y 
    line [] l

type Ewave
    line   l1
    line   l2
    line   l3  
    line   l4
    line   l5
    label  b1
    label  b2
    label  b3
    label  b4
    label  b5
    //
    bool   on
    bool   br //= na
    //
    int    dir
    //
    line   lA
    line   lB
    line   lC
    label  bA
    label  bB
    label  bC
    //
    bool next = false
    //
    label  lb
    box    bx

type fibL
    line wave1_0_500 
    line wave1_0_618 
    line wave1_0_764 
    line wave1_0_854 
    line wave1_pole_ 
    linefill l_fill_ 
    bool     _break_ //= na

//-----------------------------------------------------------------------------}
//Functions
//-----------------------------------------------------------------------------{
hi = i_hi == 'high' ? high : i_hi == 'close' ? close : math.max(open, close)
lo = i_lo == 'low'  ? low  : i_hi == 'close' ? close : math.min(open, close)

in_out(aZZ, d, x1, y1, x2, y2, col) =>
    aZZ.d.unshift(d), aZZ.x.unshift(x2), aZZ.y.unshift(y2), aZZ.d.pop(), aZZ.x.pop(), aZZ.y.pop()
    if shZZ
        aZZ.l.unshift(line.new(x1, y1, x2, y2, color= col)), aZZ.l.pop().delete()

method isSame(Ewave gEW, _1x, _2x, _3x, _4x) => 
    t1 = _1x == gEW.l1.get_x1() 
    t2 = _2x == gEW.l2.get_x1() 
    t3 = _3x == gEW.l3.get_x1()  
    t4 = _4x == gEW.l4.get_x1()
    t1 and t2 and t3 and t4

method isSame2(Ewave gEW, _1x, _2x, _3x) => 
    t1 = _1x == gEW.l3.get_x2() 
    t2 = _2x == gEW.l4.get_x2()  
    t3 = _3x == gEW.l5.get_x2()
    t1 and t2 and t3 

method dot(Ewave gEW) =>
    gEW.l1.set_style(line.style_dotted)
    gEW.l2.set_style(line.style_dotted)
    gEW.l3.set_style(line.style_dotted)
    gEW.l4.set_style(line.style_dotted)
    gEW.l5.set_style(line.style_dotted)
    gEW.b1.set_textcolor    (color(na))
    gEW.b2.set_textcolor    (color(na))
    gEW.b3.set_textcolor    (color(na))
    gEW.b4.set_textcolor    (color(na))
    gEW.b5.set_textcolor    (color(na))
    gEW.on := false

method dash(Ewave gEW) =>
    gEW.lA.set_style(line.style_dashed)
    gEW.lB.set_style(line.style_dashed)
    gEW.lC.set_style(line.style_dashed)
    gEW.bA.set_textcolor    (color(na))
    gEW.bB.set_textcolor    (color(na))
    gEW.bC.set_textcolor    (color(na))
    gEW.bx.set_bgcolor      (color(na))
    gEW.bx.set_border_color (color(na))

method sol_dot(fibL nFibL, sol_dot, col) =>
    style = 
     sol_dot ==  'dot'  ? 
      line.style_dotted : 
     sol_dot ==  'sol'  ? 
      line.style_solid  :
      line.style_dashed
    nFibL.wave1_0_500.set_style(style)
    nFibL.wave1_0_618.set_style(style)
    nFibL.wave1_0_764.set_style(style)
    nFibL.wave1_0_854.set_style(style)
    nFibL.l_fill_.set_color(col)

method set(fibL nFibL, int x1, int x2, float max_500, float max_618, float max_764, float max_854, float y2) =>
    nFibL.wave1_0_500.set_xy1(x1, max_500)
    nFibL.wave1_0_500.set_xy2(x2, max_500)
    nFibL.wave1_0_618.set_xy1(x1, max_618)
    nFibL.wave1_0_618.set_xy2(x2, max_618)
    nFibL.wave1_0_764.set_xy1(x1, max_764)
    nFibL.wave1_0_764.set_xy2(x2, max_764)
    nFibL.wave1_0_854.set_xy1(x1, max_854)
    nFibL.wave1_0_854.set_xy2(x2, max_854)
    nFibL.wave1_pole_.set_xy1(x1,     y2 )
    nFibL.wave1_pole_.set_xy2(x1, max_854)
    nFibL.l_fill_.get_line1().set_xy1(x1, max_764)
    nFibL.l_fill_.get_line1().set_xy2(x2, max_764)
    nFibL.l_fill_.get_line2().set_xy1(x1, max_854)
    nFibL.l_fill_.get_line2().set_xy2(x2, max_854)

method setNa(fibL nFibL) =>
    nFibL.wave1_0_500.set_xy1(na, na)
    nFibL.wave1_0_500.set_xy2(na, na)
    nFibL.wave1_0_618.set_xy1(na, na)
    nFibL.wave1_0_618.set_xy2(na, na)
    nFibL.wave1_0_764.set_xy1(na, na)
    nFibL.wave1_0_764.set_xy2(na, na)
    nFibL.wave1_0_854.set_xy1(na, na)
    nFibL.wave1_0_854.set_xy2(na, na)
    nFibL.wave1_pole_.set_xy1(na, na)
    nFibL.wave1_pole_.set_xy2(na, na)
    nFibL.l_fill_.set_color(color(na))

draw(enabled, left, col, n) =>
    //
    max_bars_back(time, 2000)
    var int dir = na, var int x1= na, var float y1 = na, var int x2 = na, var float y2 = na, var Ewave gEW = na
    var int last_0x = na    ,  var float last_0y = na    ,   var int last_6x = na   ,    var float last_6y = na
    //
    if enabled
        var fibL nFibL = fibL.new(
           wave1_0_500 = line.new(na, na, na, na, color= color.new(col, 50), style= line.style_solid ),
           wave1_0_618 = line.new(na, na, na, na, color= color.new(col, 38), style= line.style_solid ),
           wave1_0_764 = line.new(na, na, na, na, color= color.new(col, 24), style= line.style_solid ),
           wave1_0_854 = line.new(na, na, na, na, color= color.new(col, 15), style= line.style_solid ),
           wave1_pole_ = line.new(na, na, na, na, color= color.new(col, 50), style= line.style_dashed),
               l_fill_ = linefill.new(
                         line.new(na, na, na, na, color= color(na))
                       , line.new(na, na, na, na, color= color(na))
                       ,                          color= color(na))
                       ,                         _break_   =   na
               )
        //
        var  ZZ        aZZ   =   ZZ.new(array.new < int   > ()
                                      , array.new < int   > ()
                                      , array.new < float > ()
                                      , array.new < line  > () )
        var Ewave[]    aEW   =          array.new < Ewave > ()
        //
        if barstate.isfirst
            aEW.unshift(Ewave.new())
            for i = 0 to 10
                aZZ.d.unshift(0)
                aZZ.x.unshift(0)
                aZZ.y.unshift(0)
                aZZ.l.unshift(shZZ ? line.new(na, na, na, na) : na)
        //
        sz       = aZZ.d.size( )
        x2      := bar_index -1
        ph       = ta.pivothigh(hi, left, 1)
        pl       = ta.pivotlow (lo, left, 1)
        t        = n == 2 ? '\n\n' : n == 1 ? '\n' : ''
        //
        // when a new Pivot High is found
        if not na(ph) 
            gEW := aEW.get   (0)
            dir := aZZ.d.get (0) 
            x1  := aZZ.x.get (0) 
            y1  := aZZ.y.get (0) 
            y2  :=      nz(hi[1])
            //
            if dir <  1  // if previous point was a pl, add, and change direction ( 1)
                in_out(aZZ,  1, x1, y1, x2, y2, col)
            else
                if dir ==  1 and ph > y1 
                    aZZ.x.set(0, x2), aZZ.y.set(0, y2)
                    if shZZ
                        aZZ.l.get(0).set_xy2(x2, y2)
            //
            _6x = x2, _6y = y2
            _5x = aZZ.x.get(1), _5y = aZZ.y.get(1)
            _4x = aZZ.x.get(2), _4y = aZZ.y.get(2)
            _3x = aZZ.x.get(3), _3y = aZZ.y.get(3)
            _2x = aZZ.x.get(4), _2y = aZZ.y.get(4)
            _1x = aZZ.x.get(5), _1y = aZZ.y.get(5)
            //
            // –––––––––––––––––––––[ 12345 ]–––––––––––––––––––––
            _W5 = _6y - _5y
            _W3 = _4y - _3y
            _W1 = _2y - _1y
            min = math.min(_W1, _W3, _W5)
            isWave = 
             _W3 != min and
             _6y  > _4y and 
             _3y  > _1y and 
             _5y  > _2y
            // 
            same = gEW.isSame(_1x, _2x, _3x, _4x)
            if isWave
                if same
                    gEW.l5.set_xy2(_6x, _6y)
                    gEW.b5.set_xy (_6x, _6y)
                else
                    tx = ''
                    if _2x == aEW.get(0).b5.get_x() 
                        tx := '(5) (1)' 
                        aEW.get(0).b5.set_text('')
                    else
                        tx := '(1)'
                    //                
                    wave = Ewave.new(
                     l1  = line.new (_1x, _1y, _2x, _2y                      , color=col       , style= line.style_solid     ),
                     l2  = line.new (_2x, _2y, _3x, _3y                      , color=col       , style= line.style_solid     ),
                     l3  = line.new (_3x, _3y, _4x, _4y                      , color=col       , style= line.style_solid     ),
                     l4  = line.new (_4x, _4y, _5x, _5y                      , color=col       , style= line.style_solid     ),
                     l5  = line.new (_5x, _5y, _6x, _6y                      , color=col       , style= line.style_solid     ),
                     b1  = label.new(_2x, _2y, text= tx    + t, textcolor=col, color= color(na), style=label.style_label_down),
                     b2  = label.new(_3x, _3y, text= t + '(2)', textcolor=col, color= color(na), style=label.style_label_up  ),
                     b3  = label.new(_4x, _4y, text= '(3)' + t, textcolor=col, color= color(na), style=label.style_label_down),
                     b4  = label.new(_5x, _5y, text= t + '(4)', textcolor=col, color= color(na), style=label.style_label_up  ),
                     b5  = label.new(_6x, _6y, text= '(5)' + t, textcolor=col, color= color(na), style=label.style_label_down),
                     on  = true                                                                                               ,
                     br  = false                                                                                              ,
                     dir = 1
                      )
                    aEW.unshift(wave)
                    nFibL._break_ := false   
                    alert('New EW Motive Bullish Pattern found'  , alert.freq_once_per_bar_close)                                                                                       
            //
            if not isWave
                if same and gEW.on == true
                    gEW.dot() 
                    alert('Invalidated EW Motive Bullish Pattern', alert.freq_once_per_bar_close)                                                                                       
            //
            // –––––––––––––––––––––[ ABC ]–––––––––––––––––––––
            getEW    = aEW.get(0)
            last_0x := getEW.l1.get_x1(), last_0y := getEW.l1.get_y1()
            last_6x := getEW.l5.get_x2(), last_6y := getEW.l5.get_y2()
            diff     = math.abs(last_6y - last_0y)
            //
            if getEW.dir == -1 
                getX    = getEW.l5.get_x2()                
                getY    = getEW.l5.get_y2() 
                isSame2 = getEW.isSame2  (_1x, _2x, _3x)
                isValid =
                   _3x == getX                  and 
                   _6y  < getY + (diff * i_854) and
                   _4y  < getY + (diff * i_854) and
                   _5y  > getY
                //
                if isValid
                    width = _6x - _2x // –––[ width (4) - (c) ]–––
                    if isSame2 and getEW.bA.get_x() > _3x
                        getEW.lC.set_xy1(_5x, _5y), getEW.lC.set_xy2(_6x, _6y), getEW.bC.set_xy(_6x, _6y), getEW.bx.set_lefttop(_6x, _6y), getEW.bx.set_right(_6x + width)
                    else
                        getEW.lA := line.new (_3x, _3y, _4x, _4y, color=col), getEW.bA := label.new(_4x, _4y, text= '(a)' + t, textcolor=col, color= color(na), style=label.style_label_down)
                        getEW.lB := line.new (_4x, _4y, _5x, _5y, color=col), getEW.bB := label.new(_5x, _5y, text= t + '(b)', textcolor=col, color= color(na), style=label.style_label_up  )
                        getEW.lC := line.new (_5x, _5y, _6x, _6y, color=col), getEW.bC := label.new(_6x, _6y, text= '(c)' + t, textcolor=col, color= color(na), style=label.style_label_down)
                        getEW.bx := box.new  (_6x, _6y, _6x + width, _4y, bgcolor=color.new(col, 93), border_color=color.new(col, 65))
                        alert('New EW Corrective Bullish Pattern found'  , alert.freq_once_per_bar_close)                                                                                       
                else
                    if isSame2 and getEW.bA.get_x() > _3x
                        getEW.dash()
                        alert('Invalidated EW Corrective Bullish Pattern', alert.freq_once_per_bar_close)                                                                                       
            //
            // –––––––––––––––––––––[ new (1) ? ]–––––––––––––––––––––
            if getEW.dir ==  1 
                if _5x == getEW.bC.get_x() and 
                   _6y >  getEW.b5.get_y() and
                   getEW.next  == false
                    getEW.next := true
                    getEW.lb   := label.new(_6x, _6y, style=label.style_circle, color=color.new(col, 65), yloc=yloc.abovebar, size=size.tiny)
                    alert('Possible new start of EW Motive Bullish Wave', alert.freq_once_per_bar_close)                                                                                       
        //
        // when a new Pivot Low is found
        if not na(pl) 
            gEW := aEW.get   (0)
            dir := aZZ.d.get (0) 
            x1  := aZZ.x.get (0) 
            y1  := aZZ.y.get (0) 
            y2  :=      nz(lo[1])
            //
            if dir > -1  // if previous point was a ph, add, and change direction (-1)
                in_out(aZZ, -1, x1, y1, x2, y2, col)
            else
                if dir == -1 and pl < y1 
                    aZZ.x.set(0, x2), aZZ.y.set(0, y2)
                    if shZZ
                        aZZ.l.get(0).set_xy2(x2, y2)
            //
            _6x = x2, _6y = y2
            _5x = aZZ.x.get(1), _5y = aZZ.y.get(1)
            _4x = aZZ.x.get(2), _4y = aZZ.y.get(2)
            _3x = aZZ.x.get(3), _3y = aZZ.y.get(3)
            _2x = aZZ.x.get(4), _2y = aZZ.y.get(4)
            _1x = aZZ.x.get(5), _1y = aZZ.y.get(5)
            //
            // –––––––––––––––––––––[ 12345 ]–––––––––––––––––––––
            _W5 = _5y - _6y
            _W3 = _3y - _4y
            _W1 = _1y - _2y
            min = math.min(_W1, _W3, _W5)
            isWave = 
             _W3 != min and
             _4y  > _6y and 
             _1y  > _3y and 
             _2y  > _5y
            // 
            same = isSame(gEW, _1x, _2x, _3x, _4x)
            if isWave
                if same
                    gEW.l5.set_xy2(_6x, _6y)
                    gEW.b5.set_xy (_6x, _6y)
                else
                    tx = ''
                    if _2x == aEW.get(0).b5.get_x() 
                        tx := '(5) (1)' 
                        aEW.get(0).b5.set_text('')
                    else
                        tx := '(1)'
                    //
                    wave = Ewave.new(
                     l1  = line.new (_1x, _1y, _2x, _2y                      , color=col       , style= line.style_solid     ),
                     l2  = line.new (_2x, _2y, _3x, _3y                      , color=col       , style= line.style_solid     ),
                     l3  = line.new (_3x, _3y, _4x, _4y                      , color=col       , style= line.style_solid     ),
                     l4  = line.new (_4x, _4y, _5x, _5y                      , color=col       , style= line.style_solid     ),
                     l5  = line.new (_5x, _5y, _6x, _6y                      , color=col       , style= line.style_solid     ),
                     b1  = label.new(_2x, _2y, text= t    + tx, textcolor=col, color= color(na), style=label.style_label_up  ),
                     b2  = label.new(_3x, _3y, text= '(2)' + t, textcolor=col, color= color(na), style=label.style_label_down),
                     b3  = label.new(_4x, _4y, text= t + '(3)', textcolor=col, color= color(na), style=label.style_label_up  ),
                     b4  = label.new(_5x, _5y, text= '(4)' + t, textcolor=col, color= color(na), style=label.style_label_down),
                     b5  = label.new(_6x, _6y, text= t + '(5)', textcolor=col, color= color(na), style=label.style_label_up  ),
                     on  = true                                                                                               ,
                     br  = false                                                                                              ,
                     dir =-1
                      )
                    aEW.unshift(wave)
                    nFibL._break_ := false 
                    alert('New EW Motive Bearish Pattern found'  , alert.freq_once_per_bar_close)                                                                                                                                                            
            //        
            if not isWave
                if same and gEW.on == true
                    gEW.dot()   
                    alert('Invalidated EW Motive Bearish Pattern', alert.freq_once_per_bar_close)                                                                                       
            //
            // –––––––––––––––––––––[ ABC ]–––––––––––––––––––––
            getEW    = aEW.get(0)
            last_0x := getEW.l1.get_x1(), last_0y := getEW.l1.get_y1()
            last_6x := getEW.l5.get_x2(), last_6y := getEW.l5.get_y2()
            diff     = math.abs(last_6y - last_0y)
            //
            if getEW.dir ==  1 
                getX    = getEW.l5.get_x2()                
                getY    = getEW.l5.get_y2() 
                isSame2 = getEW.isSame2  (_1x, _2x, _3x)
                isValid =
                   _3x == getX                  and 
                   _6y  > getY - (diff * i_854) and
                   _4y  > getY - (diff * i_854) and
                   _5y  < getY
                //
                if isValid
                    width = _6x - _2x // –––[ width (4) - (c) ]–––
                    if isSame2 and getEW.bA.get_x() > _3x
                        getEW.lC.set_xy1(_5x, _5y), getEW.lC.set_xy2(_6x, _6y), getEW.bC.set_xy(_6x, _6y), getEW.bx.set_lefttop(_6x, _6y), getEW.bx.set_right(_6x + width)
                    else
                        getEW.lA := line.new (_3x, _3y, _4x, _4y, color=col), getEW.bA := label.new(_4x, _4y, text= t + '(a)', textcolor=col, color= color(na), style=label.style_label_up  )
                        getEW.lB := line.new (_4x, _4y, _5x, _5y, color=col), getEW.bB := label.new(_5x, _5y, text= '(b)' + t, textcolor=col, color= color(na), style=label.style_label_down)
                        getEW.lC := line.new (_5x, _5y, _6x, _6y, color=col), getEW.bC := label.new(_6x, _6y, text= t + '(c)', textcolor=col, color= color(na), style=label.style_label_up  )
                        getEW.bx := box.new  (_6x, _6y, _6x + width, _4y, bgcolor=color.new(col, 93), border_color=color.new(col, 65))
                        alert('New EW Corrective Bearish Pattern found'  , alert.freq_once_per_bar_close)                                                                                       
                else
                    if isSame2 and getEW.bA.get_x() > _3x
                        getEW.dash() 
                        alert('Invalidated EW Corrective Bullish Pattern', alert.freq_once_per_bar_close)                                                                                       
            //
            // –––[ check (only once) for a possible new (1) after an impulsive AND corrective wave ]–––
            if getEW.dir == -1 
                if _5x == getEW.bC.get_x() and 
                   _6y <  getEW.b5.get_y() and
                   getEW.next  == false
                    getEW.next := true
                    getEW.lb   := label.new(_6x, _6y, style=label.style_circle, color=color.new(col, 65), yloc=yloc.belowbar, size=size.tiny)
                    alert('Possible new start of EW Motive Bearish Wave', alert.freq_once_per_bar_close)                                                                                       
        //                    
        // –––[ check for break box ]–––
        if aEW.size() > 0
            gEW    := aEW.get(0)
            if gEW.dir == 1 
                if ta.crossunder(low , gEW.bx.get_bottom()) and bar_index <= gEW.bx.get_right()
                    label.new(bar_index, low , yloc= yloc.belowbar, style= label.style_xcross, color=color.red, size=size.tiny)
            else
                if ta.crossover (high, gEW.bx.get_top   ()) and bar_index <= gEW.bx.get_right()
                    label.new(bar_index, high, yloc= yloc.abovebar, style= label.style_xcross, color=color.red, size=size.tiny)       
        //
        if barstate.islast
            //  –––[ get last 2 EW's ]–––
            getEW    = aEW.get(0)
            if aEW.size() > 1
                getEW1   = aEW.get(1)
                last_0x := getEW.l1.get_x1(), last_0y := getEW.l1.get_y1()
                last_6x := getEW.l5.get_x2(), last_6y := getEW.l5.get_y2()
                //
                diff = math.abs(last_6y - last_0y) // –––[ max/min difference ]–––
                _500 = diff * i_500
                _618 = diff * i_618
                _764 = diff * i_764
                _854 = diff * i_854
                bull = getEW.dir == 1 
                // –––[ if EW is not valid or an ABC has developed -> remove fibonacci lines ]–––
                if getEW.on == false or getEW.bC.get_x() > getEW.b5.get_x()
                    nFibL.setNa()
                else
                // –––[ get.on == true ~ valid EW ]–––
                    max_500 = last_6y + ((bull ? -1 : 1) * _500)
                    max_618 = last_6y + ((bull ? -1 : 1) * _618)
                    max_764 = last_6y + ((bull ? -1 : 1) * _764)
                    max_854 = last_6y + ((bull ? -1 : 1) * _854)
                    //
                    nFibL.set(last_6x, bar_index + 10, max_500, max_618, max_764, max_854, last_6y)
                // –––[ if (2) label overlap with (C) label ]–––
                if  getEW.b2.get_x() == getEW1.bC.get_x()
                    getEW.b1.set_textcolor(color(na))
                    getEW.b2.set_textcolor(color(na))
                    strB  = getEW1.bB.get_text() 
                    strC  = getEW1.bC.get_text()
                    strB_ = str.replace(strB, "(b)",  "(b) (1)", 0)
                    strC_ = str.replace(strC, "(c)",  "(c) (2)", 0)
                    getEW1.bB.set_text(strB_)
                    getEW1.bC.set_text(strC_)
            //        
            // –––[ check if fib limits are broken ]–––
            getP_854 = nFibL.wave1_0_854.get_y1()
            for i = 0 to bar_index - nFibL.wave1_0_854.get_x1()
                if getEW.dir == -1
                    if high[i] > getP_854
                        nFibL._break_ := true
                        break
                else
                    if low [i] < getP_854
                        nFibL._break_ := true
                        break  
            //––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
            switch nFibL._break_
                true  => nFibL.sol_dot('dot', color.new(color.red , 95))
                false => nFibL.sol_dot('sol', color.new(color.lime, 95))
                => 
                    nFibL.wave1_0_500.set_xy1(na, na)
                    nFibL.wave1_0_500.set_xy2(na, na)
                    nFibL.wave1_0_618.set_xy1(na, na)
                    nFibL.wave1_0_618.set_xy2(na, na)
                    nFibL.wave1_0_764.set_xy1(na, na)
                    nFibL.wave1_0_764.set_xy2(na, na)
                    nFibL.wave1_0_854.set_xy1(na, na)
                    nFibL.wave1_0_854.set_xy2(na, na)
                    nFibL.wave1_pole_.set_xy1(na, na)
                    nFibL.wave1_pole_.set_xy2(na, na)
                    nFibL.l_fill_.set_color(color(na))

        if aEW.size() > 15 
            pop = aEW.pop()
            pop.l1.delete(), pop.b1.delete()
            pop.l2.delete(), pop.b2.delete()
            pop.l3.delete(), pop.b3.delete()
            pop.l4.delete(), pop.b4.delete()
            pop.l5.delete(), pop.b5.delete()
            pop.lA.delete(), pop.bA.delete()
            pop.lB.delete(), pop.bB.delete()
            pop.lC.delete(), pop.bC.delete()
            pop.lb.delete(), pop.bx.delete()
        //----------------------------------

//-----------------------------------------------------------------------------}
//Plots
//-----------------------------------------------------------------------------{
draw(s1, len1, col1, 0)
draw(s2, len2, col2, 1)
draw(s3, len3, col3, 2)

//-----------------------------------------------------------------------------}

fair vale gaps logic 

// This work is licensed under a Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0) https://creativecommons.org/licenses/by-nc-sa/4.0/
// © LuxAlgo

//@version=5
indicator("Fair Value Gap [LuxAlgo]", "LuxAlgo - Fair Value Gap", overlay = true, max_lines_count = 500, max_boxes_count = 500)
//------------------------------------------------------------------------------
//Settings
//-----------------------------------------------------------------------------{
thresholdPer = input.float(0, "Threshold %", minval = 0, maxval = 100, step = .1, inline = 'threshold')
auto = input(false, "Auto", inline = 'threshold')

showLast = input.int(0, 'Unmitigated Levels', minval = 0)
mitigationLevels = input.bool(false, 'Mitigation Levels')

tf = input.timeframe('', "Timeframe")

//Style
extend = input.int(20, 'Extend', minval = 0, inline = 'extend', group = 'Style')
dynamic = input(false, 'Dynamic', inline = 'extend', group = 'Style')

bullCss = input.color(color.new(#089981, 70), "Bullish FVG", group = 'Style')
bearCss = input.color(color.new(#f23645, 70), "Bearish FVG", group = 'Style')

//Dashboard
showDash  = input(false, 'Show Dashboard', group = 'Dashboard')
dashLoc  = input.string('Top Right', 'Location', options = ['Top Right', 'Bottom Right', 'Bottom Left'], group = 'Dashboard')
textSize = input.string('Small', 'Size'        , options = ['Tiny', 'Small', 'Normal']                 , group = 'Dashboard')

//-----------------------------------------------------------------------------}
//UDT's
//-----------------------------------------------------------------------------{
type fvg
    float max
    float min
    bool  isbull
    int   t = time

//-----------------------------------------------------------------------------}
//Methods/Functions
//-----------------------------------------------------------------------------{
n = bar_index

method tosolid(color id)=> color.rgb(color.r(id),color.g(id),color.b(id))

detect()=>
    var new_fvg = fvg.new(na, na, na, na)
    threshold = auto ? ta.cum((high - low) / low) / bar_index : thresholdPer / 100

    bull_fvg = low > high[2] and close[1] > high[2] and (low - high[2]) / high[2] > threshold
    bear_fvg = high < low[2] and close[1] < low[2] and (low[2] - high) / high > threshold
    
    if bull_fvg
        new_fvg := fvg.new(low, high[2], true)
    else if bear_fvg
        new_fvg := fvg.new(low[2], high, false)

    [bull_fvg, bear_fvg, new_fvg]

//-----------------------------------------------------------------------------}
//FVG's detection/display
//-----------------------------------------------------------------------------{
var float max_bull_fvg = na, var float min_bull_fvg = na, var bull_count = 0, var bull_mitigated = 0
var float max_bear_fvg = na, var float min_bear_fvg = na, var bear_count = 0, var bear_mitigated = 0
var t = 0

var fvg_records = array.new<fvg>(0)
var fvg_areas = array.new<box>(0)

[bull_fvg, bear_fvg, new_fvg] = request.security(syminfo.tickerid, tf, detect())

//Bull FVG's
if bull_fvg and new_fvg.t != t
    if dynamic
        max_bull_fvg := new_fvg.max
        min_bull_fvg := new_fvg.min
    
    //Populate FVG array
    if not dynamic
        fvg_areas.unshift(box.new(n-2, new_fvg.max, n+extend, new_fvg.min, na, bgcolor = bullCss))
    fvg_records.unshift(new_fvg)

    bull_count += 1
    t := new_fvg.t
else if dynamic
    max_bull_fvg := math.max(math.min(close, max_bull_fvg), min_bull_fvg)

//Bear FVG's
if bear_fvg and new_fvg.t != t
    if dynamic
        max_bear_fvg := new_fvg.max
        min_bear_fvg := new_fvg.min
    
    //Populate FVG array
    if not dynamic
        fvg_areas.unshift(box.new(n-2, new_fvg.max, n+extend, new_fvg.min, na, bgcolor = bearCss))
    fvg_records.unshift(new_fvg)

    bear_count += 1
    t := new_fvg.t
else if dynamic
    min_bear_fvg := math.min(math.max(close, min_bear_fvg), max_bear_fvg) 

//-----------------------------------------------------------------------------}
//Unmitigated/Mitigated lines
//-----------------------------------------------------------------------------{
//Test for mitigation
if fvg_records.size() > 0
    for i = fvg_records.size()-1 to 0
        get = fvg_records.get(i)

        if get.isbull
            if close < get.min
                //Display line if mitigated
                if mitigationLevels
                    line.new(get.t
                      , get.min
                      , time
                      , get.min
                      , xloc.bar_time
                      , color = bullCss
                      , style = line.style_dashed)

                //Delete box
                if not dynamic
                    area = fvg_areas.remove(i)
                    area.delete()

                fvg_records.remove(i)
                bull_mitigated += 1
        else if close > get.max
            //Display line if mitigated
            if mitigationLevels
                line.new(get.t
                  , get.max
                  , time
                  , get.max
                  , xloc.bar_time
                  , color = bearCss
                  , style = line.style_dashed)

            //Delete box
            if not dynamic
                area = fvg_areas.remove(i)
                area.delete()
            
            fvg_records.remove(i)
            bear_mitigated += 1

//Unmitigated lines
var unmitigated = array.new<line>(0)

//Remove umitigated lines 
if barstate.islast and showLast > 0 and fvg_records.size() > 0
    if unmitigated.size() > 0 
        for element in unmitigated
            element.delete()
        unmitigated.clear()

    for i = 0 to math.min(showLast-1, fvg_records.size()-1)
        get = fvg_records.get(i)

        unmitigated.push(line.new(get.t
          , get.isbull ? get.min : get.max 
          , time
          , get.isbull ? get.min : get.max
          , xloc.bar_time
          , color = get.isbull ? bullCss : bearCss))

//-----------------------------------------------------------------------------}
//Dashboard
//-----------------------------------------------------------------------------{
var table_position = dashLoc == 'Bottom Left' ? position.bottom_left 
  : dashLoc == 'Top Right' ? position.top_right 
  : position.bottom_right

var table_size = textSize == 'Tiny' ? size.tiny 
  : textSize == 'Small' ? size.small 
  : size.normal

var tb = table.new(table_position, 3, 3
  , bgcolor = #1e222d
  , border_color = #373a46
  , border_width = 1
  , frame_color = #373a46
  , frame_width = 1)

if showDash
    if barstate.isfirst
        tb.cell(1, 0, 'Bullish', text_color = bullCss.tosolid(), text_size = table_size)
        tb.cell(2, 0, 'Bearish', text_color = bearCss.tosolid(), text_size = table_size)
    
        tb.cell(0, 1, 'Count', text_size = table_size, text_color = color.white)
        tb.cell(0, 2, 'Mitigated', text_size = table_size, text_color = color.white)
    
    if barstate.islast
        tb.cell(1, 1, str.tostring(bull_count), text_color = bullCss.tosolid(), text_size = table_size)
        tb.cell(2, 1, str.tostring(bear_count), text_color = bearCss.tosolid(), text_size = table_size)
        
        tb.cell(1, 2, str.tostring(bull_mitigated / bull_count * 100, format.percent), text_color = bullCss.tosolid(), text_size = table_size)
        tb.cell(2, 2, str.tostring(bear_mitigated / bear_count * 100, format.percent), text_color = bearCss.tosolid(), text_size = table_size)

//-----------------------------------------------------------------------------}
//Plots
//-----------------------------------------------------------------------------{
//Dynamic Bull FVG
max_bull_plot = plot(max_bull_fvg, color = na)
min_bull_plot = plot(min_bull_fvg, color = na)
fill(max_bull_plot, min_bull_plot, color = bullCss)

//Dynamic Bear FVG
max_bear_plot = plot(max_bear_fvg, color = na)
min_bear_plot = plot(min_bear_fvg, color = na)
fill(max_bear_plot, min_bear_plot, color = bearCss)

//-----------------------------------------------------------------------------}
//Alerts
//-----------------------------------------------------------------------------{
alertcondition(bull_count > bull_count[1], 'Bullish FVG', 'Bullish FVG detected')
alertcondition(bear_count > bear_count[1], 'Bearish FVG', 'Bearish FVG detected')

alertcondition(bull_mitigated > bull_mitigated[1], 'Bullish FVG Mitigation', 'Bullish FVG mitigated')
alertcondition(bear_mitigated > bear_mitigated[1], 'Bearish FVG Mitigation', 'Bearish FVG mitigated')

//-----------------------------------------------------------------------------}