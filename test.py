from rapidconnect import RapidConnect
rapid = RapidConnect("cs421", "c10b4173-cbf3-47c1-a35c-385dc88905c9")

result = rapid.call('YelpAPI', 'getBusinesses', { 
  'accessToken': '_4Zt6rM00ZWHNhuIjmN7vGittFp5PoII9pZjidLmuCc2EAy2jTqPYCV2gnBN1c_SuxFMLkg4hnxL0FVz5Rz8G7jmfopiae2hrw-4VqiA6LX_lK3jOU5LkkFBWUL6WHYx',
  'term': '',
  'location': '842 w taylor street',
  'latitude': '',
  'longitude': '',
  'radius': '200',
  'categories': 'food,vietnamese',
  'locale': '',
  'limit': '',
  'offset': '',
  'sortBy': '',
  'price': '',
  'openNow': '',
  'openAt': '',
  'attributes': ''
 
})

print result