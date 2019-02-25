export const buffer = () => {
  const b: any[] = []
  const res = (newValue: any) => {
    b.push(newValue)
  }
  res.toArray = () => {
    return b
  }
  return res
}

export const getPlainObj = () => ({
  name: 'Adam',
  family: {
    father: {
      name: 'daddy'
    },
    mother: {
      name: 'mummy'
    }
  },
  pets: [
    {
      type: 'cat',
      name: 'Cathy'
    }
  ],
  skills: ['eat', 'sleep']
})
