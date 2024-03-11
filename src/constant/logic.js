const registers = {
    A: 0,
    B: 0,
    C: 0,
    D: 0,
    E: 0,
    H: 0,
    L: 0,
};
const flag={
    S:0,
    Z:0,
    AC:0,
    P:0,
    CY:0,
};
const memory = [];
const arithmeticFunctions = {
    ADD: (srcReg) => { registers["A"] += registers[srcReg];},
    MADD: (address) => { registers["A"] += memory[address];},
    ADC:(srcReg)=>{registers["A"]+=flag["CY"]+registers[srcReg];},
    MADC: (address) => { registers["A"] +=flag["CY"]+memory[address];},
    ADI:(data)=>{registers["A"]+=data;},
    ACI:(data)=>{registers["A"]+=flag["CY"]+data;},
    DAD: (regPair) => {
        const hlValue = (registers["H"] << 8) | registers["L"];
        const rpValue = (registers[regPair[0]] << 8) | registers[regPair[1]];
        const result = hlValue + rpValue;
        registers["H"] = (result & 0xFF00) >> 8;
        registers["L"] = result & 0x00FF;
        if (result > 0xFFFF) registers["F"] |= FLAGS.CARRY;
        else registers["F"] &= ~FLAGS.CARRY;
    },
    SBB: (srcReg) => {
        const carry = (registers["F"] & FLAGS.CARRY) ? 1 : 0;
        const result = registers["A"] - registers[srcReg] - carry;
        registers["F"] = 0;
        if (result < 0) registers["F"] |= FLAGS.CARRY;
        registers["A"] = result & 0xFF;
        if (registers["A"] === 0) registers["F"] |= FLAGS.ZERO;
    },
    // SUI operation
    SUI: (immediateData) => {
        const carry = (registers["F"] & FLAGS.CARRY) ? 1 : 0;
        const result = registers["A"] - immediateData - carry;
        registers["F"] = 0;
        if (result < 0) registers["F"] |= FLAGS.CARRY;
        registers["A"] = result & 0xFF;
        if (registers["A"] === 0) registers["F"] |= FLAGS.ZERO;
    },
    // SBI operation
    SBI: (immediateData) => {
        const carry = (registers["F"] & FLAGS.CARRY) ? 1 : 0;
        const result = registers["A"] - (immediateData + carry);
        registers["F"] = 0;
        if (result < 0) registers["F"] |= FLAGS.CARRY;
        registers["A"] = result & 0xFF;
        if (registers["A"] === 0) registers["F"] |= FLAGS.ZERO;
    },
    SUB: (srcReg) => { registers["A"] -= registers[srcReg]; 
    const result=registers["A"];
    UPDATE(result);
    },
    MSUB: (address) => { registers["A"] -= memory[address]; 
    const result=registers["A"];
    UPDATE(result);
    },
    INR: (reg) => { registers[reg]++; },
    INX: (regPair) => {
        const regPairValue = (registers[regPair[0]] << 8) | registers[regPair[1]];
        regPairValue++;
        registers[regPair[0]] = (regPairValue & 0xFF00) >> 8;
        registers[regPair[1]] = regPairValue & 0x00FF;
    },
    MINR: (address) => { memory[address]++; },
    DCR: (reg) => { registers[reg]--; },
    MDCR: (address) => { memory[address]--; },
    DCX: (regPair) => {
        const regPairValue = (registers[regPair[0]] << 8) | registers[regPair[1]];
        regPairValue--;
        registers[regPair[0]] = (regPairValue & 0xFF00) >> 8;
        registers[regPair[1]] = regPairValue & 0x00FF;
    },
};
const move={
    MOV:(srcReg,desReg)=>{registers[desReg]=registers[srcReg];},
    MMOV:(desReg,address)=>{reg[desReg]=memory[address];},
    IMOV:(desReg,data)=>{registers[desReg]=data;},
    MMVI:(address,data)=>{memory[address]=data;},
    MVI:(srcReg,data)=>{registers[srcReg]=data;},
    LXI: (destRegPair, data) => { registers[destRegPair[0]] = (data & 0xFF00) >> 8; registers[destRegPair[1]] = data & 0x00FF; },
    LDA: (address) => { registers["A"] = memory[address]; },
    LDAX: (regPair) => { registers["A"] = memory[(registers[regPair[0]] << 8) | registers[regPair[1]]]; },
    LHLD:(address)=>{registers["L"]=memory[address];registers["H"]=memory[address+1];},
    STA:(address)=>{memory[address]=registers["A"];},
    STAX:(regPair)=>{memory[registers[regPair[1]]+registers[regPair[0]]]=registers["A"];},
    SHLD:(address)=>{memory[address]=registers["L"];memory[address+1]=registers["H"];},
    XCHG: () => { [registers["H"], registers["D"]] = [registers["D"], registers["H"]]; [registers["L"], registers["E"]] = [registers["E"], registers["L"]]; },
};

const logicFunctions = {
    CMP:(srcReg)=>{const result = registers["A"]-registers[srcReg];
    if(result<0)flag["CY"]=1;
    else if(result==0)flag["Z"]=1;
    else {flag["Z"]=0;flag["CY"]=0;};
    },
    MCMP:(address)=>{const result = registers["A"]-memory[address];
    if(result<0)flag["CY"]=1;
    else if(result==0)flag["Z"]=1;
    else {flag["Z"]=0;flag["CY"]=0;};
    },
    CPI:(data)=>{const result = registers["A"]-data;
    if(result<0)flag["CY"]=1;
    else if(result==0)flag["Z"]=1;
    else {flag["Z"]=0;flag["CY"]=0;};
    },
    ANA: (srcReg) => { registers["A"] &= registers[srcReg]; },
    MANA: (address) => { registers["A"] &= memory[address]; },
    ANI: (data) => { registers["A"] &= data; },
    ORA: (srcReg) => { registers["A"] |= registers[srcReg]; },
    MORA: (address) => { registers["A"] |= memory[address]; },
    ORI: (data) => { registers["A"] |= data; },
    XRA: (srcReg) => { registers["A"] ^= registers[srcReg]; },
    MXRA: (address) => { registers["A"] ^= memory[address]; },
    XRI: (data) => { registers["A"] ^= data; },
    RLC: () => {
        const msb = (registers["A"] & 0x80) >> 7;
        registers["A"] = ((registers["A"] << 1) | flags["CY"]) & 0xFF;
        flags["CY"] = msb;
    },
    RRC: () => {
        const lsb = registers["A"] & 0x01;
        registers["A"] = (registers["A"] >> 1) | (flags["CY"] << 7);
        flags["CY"] = lsb;
    },
    RAL: () => {
        const msb = (registers["A"] & 0x80) >> 7;
        registers["A"] = ((registers["A"] << 1) | flags["CY"]) & 0xFF;
        flags["CY"] = msb;
    },
    RAR: () => {
        const lsb = registers["A"] & 0x01;
        registers["A"] = (registers["A"] >> 1) | (flags["CY"] << 7);
        flags["CY"] = lsb;
    },
    CMA: () => {
        registers["A"] = ~registers["A"] & 0xFF;
    },
    CMC: () => {
        flags["CY"] = flags["CY"] ? 0 : 1;
    },
    STC: () => {
        flags["CY"] = 1;
    },
}