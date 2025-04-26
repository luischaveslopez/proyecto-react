const BAD_WORDS = [
    "odio"
  ];
  
  export const checkInappropriateContent = (text) => {
    const lower = text.toLowerCase();
    return BAD_WORDS.some(word => lower.includes(word));
  };