import dotenv from 'dotenv'
dotenv.config()

import { db } from './database.js'
console.log('starting seed...')

const songs = [
  { q: 'Dancing Queen ABBA', year: 1976 },
  { q: 'Gimme Shelter The Rolling Stones', year: 1969 },
  { q: 'Like a Rolling Stone Bob Dylan', year: 1965 },
  { q: 'Roxanne The Police', year: 1978 },
  { q: 'Respect Aretha Franklin', year: 1967 },
  { q: 'Heart of Gold Neil Young', year: 1972 },
  { q: 'Purple Haze Jimi Hendrix', year: 1967 },
  { q: 'My Generation The Who', year: 1965 },
  { q: 'Bohemian Rhapsody Queen', year: 1975 },
  { q: 'Space Oddity David Bowie', year: 1969 },
  { q: 'Get Up Stand Up Bob Marley', year: 1973 },
  { q: 'Sunny Bobby Hebb', year: 1966 },
  { q: 'Light My Fire The Doors', year: 1967 },
  { q: 'Go Your Own Way Fleetwood Mac', year: 1977 },
  { q: 'Take on Me a-ha', year: 1985 },
  { q: 'Africa Toto', year: 1982 },
  { q: "Don't Stop Believin' Journey", year: 1981 },
  { q: 'Personal Jesus Depeche Mode', year: 1989 },
  { q: 'Jolene Dolly Parton', year: 1973 },
  { q: 'Waterloo ABBA', year: 1974 },
  { q: 'War Pigs Black Sabbath', year: 1970 },
  { q: 'Jump Van Halen', year: 1984 },
  { q: 'Billie Jean Michael Jackson', year: 1983 },
  { q: 'Purple Rain Prince', year: 1984 },
  { q: "Livin' On A Prayer Bon Jovi", year: 1986 },
  { q: 'Tainted Love Soft Cell', year: 1981 },
  { q: 'Angie The Rolling Stones', year: 1973 },
  { q: 'Every Breath You Take The Police', year: 1983 },
  { q: 'Losing My Religion R.E.M.', year: 1991 },
  { q: '...Baby One More Time Britney Spears', year: 1998 },
  { q: 'No Scrubs TLC', year: 1999 },
  { q: 'Creep Radiohead', year: 1992 },
  { q: 'Wannabe Spice Girls', year: 1996 },
  { q: "Gangsta's Paradise Coolio", year: 1995 },
  { q: 'Wake Me Up Before You Go-Go Wham!', year: 1984 },
  { q: 'Karma Chameleon Culture Club', year: 1983 },
  { q: 'Everybody Wants To Rule The World Tears For Fears', year: 1985 },
  { q: 'Float On Modest Mouse', year: 2004 },
  { q: 'Need You Tonight INXS', year: 1987 },
  { q: 'Black Hole Sun Soundgarden', year: 1994 },
  { q: 'Fast Car Tracy Chapman', year: 1988 },
  { q: 'Smells Like Teen Spirit Nirvana', year: 1991 },
  { q: 'No Rain Blind Melon', year: 1992 },
  { q: 'Semi-Charmed Life Third Eye Blind', year: 1997 },
  { q: 'Steal My Sunshine LEN', year: 1999 },
  { q: 'Boulevard of Broken Dreams Green Day', year: 2004 },
  { q: 'Champagne Supernova Oasis', year: 1995 },
  { q: 'Mr. Brightside The Killers', year: 2003 },
  { q: 'Waterfalls TLC', year: 1995 },
  { q: 'Un-Break My Heart Toni Braxton', year: 1996 },
  { q: 'Iris The Goo Goo Dolls', year: 1998 },
  { q: 'High and Dry Radiohead', year: 1995 },
  { q: 'Breathe (2 AM) Anna Nalick', year: 2005 },
  { q: 'Crazy In Love Beyoncé', year: 2003 },
  { q: 'Everybody Hurts R.E.M.', year: 1993 },
  { q: 'Bitter Sweet Symphony The Verve', year: 1997 },
  { q: 'Maps Yeah Yeah Yeahs', year: 2003 },
  { q: 'Since U Been Gone Kelly Clarkson', year: 2004 },
  { q: 'Beautiful Day U2', year: 2000 },
  { q: 'Numb Linkin Park', year: 2003 },
  { q: 'Chasing Cars Snow Patrol', year: 2006 },
  { q: 'Single Ladies Beyoncé', year: 2008 },
  { q: 'Take Me Out Franz Ferdinand', year: 2004 },
  { q: 'Rolling in the Deep Adele', year: 2010 },
  { q: 'Poker Face Lady Gaga', year: 2008 },
  { q: 'Breezeblocks alt-J', year: 2012 },
  { q: 'Blinding Lights The Weeknd', year: 2019 },
  { q: 'Dani California Red Hot Chili Peppers', year: 2006 },
  { q: 'Rehab Amy Winehouse', year: 2006 },
  { q: 'Toxic Britney Spears', year: 2004 },
  { q: 'Chandelier Sia', year: 2014 },
  { q: 'Hotline Bling Drake', year: 2015 },
  { q: 'bad guy Billie Eilish', year: 2019 },
  { q: 'Old Town Road Lil Nas X', year: 2019 },
  { q: 'Sunflower Post Malone', year: 2018 },
  { q: 'Despacito Luis Fonsi', year: 2017 },
  { q: 'Thinking out Loud Ed Sheeran', year: 2014 },
  { q: 'Thrift Shop Macklemore', year: 2012 },
  { q: 'Happy Pharrell Williams', year: 2013 },
  { q: 'Get Lucky Daft Punk', year: 2013 },
  { q: 'Love On Top Beyoncé', year: 2011 },
  { q: "God's Plan Drake", year: 2018 },
  { q: 'Pumped Up Kicks Foster The People', year: 2010 },
  { q: 'The Less I Know The Better Tame Impala', year: 2015 },
  { q: 'Jigsaw Falling Into Place Radiohead', year: 2007 },
  { q: 'Would Alice In Chains', year: 1992 },
  { q: 'She Will Lil Wayne', year: 2011 },
  { q: 'Redbone Childish Gambino', year: 2016 },
  { q: 'The Adults Are Talking The Strokes', year: 2020 },
  { q: 'Righteous Juice WRLD', year: 2020 },
  { q: 'I Wonder Kanye West', year: 2007 },
  { q: 'Let Her Go Passenger', year: 2012 },
  { q: 'Riptide Vance Joy', year: 2013 },
  { q: 'Politik Coldplay', year: 2002 },
  { q: 'Black Pearl Jam', year: 1991 },
  { q: 'Last Kiss Pearl Jam', year: 1999 },
  { q: 'Yellow Coldplay', year: 2000 },
  { q: 'Paradise Coldplay', year: 2011 },
  { q: '505 Arctic Monkeys', year: 2006 },
  { q: 'Mardy Bum Arctic Monkeys', year: 2006 },
  { q: 'Hunting High and Low a-ha', year: 1985 },
  { q: 'Loser Tame Impala', year: 2012 },
  { q: 'Sunday Morning Maroon 5', year: 2002 },
  { q: 'Payphone Maroon 5', year: 2012 },
  { q: 'Moves Like Jagger Maroon 5', year: 2011 },
  { q: 'Supermassive Black Hole Muse', year: 2006 },
  { q: 'Plug in Baby Muse', year: 2001 },
  { q: 'Do I Wanna Know? Arctic Monkeys', year: 2013 },
  { q: '1979 The Smashing Pumpkins', year: 1995 },
  { q: 'Pursuit Of Happiness Kid Cudi', year: 2009 },
  { q: 'Naive The Kooks', year: 2006 },
  { q: 'All Apologies Nirvana', year: 1993 },
  { q: 'Plush Stone Temple Pilots', year: 1992 },
  { q: 'I THINK Tyler The Creator', year: 2019 },
  { q: 'HUMBLE. Kendrick Lamar', year: 2017 },
  { q: 'Not Like Us Kendrick Lamar', year: 2024 },
  { q: 'Maybe Tomorrow Stereophonics', year: 2003 },
  { q: 'Mercy Duffy', year: 2008 },
  { q: 'Pour Some Sugar On Me Def Leppard', year: 1987 },
  { q: 'Creep Stone Temple Pilots', year: 1992 },
  { q: 'Burden In My Hand Soundgarden', year: 1996 },
  { q: 'All The Stars Kendrick Lamar', year: 2018 },
  { q: 'Lose Control Teddy Swims', year: 2023 },
  { q: 'ME! Taylor Swift', year: 2019 },
  { q: 'Weak AJR', year: 2019 },
  { q: 'A Horse with No Name America', year: 1971 },
  { q: 'Radio Ga Ga Queen', year: 1984 },
  { q: 'Three Little Birds Bob Marley', year: 1977 },
  { q: 'The World We Knew Frank Sinatra', year: 1967 },
  { q: 'The Real Slim Shady Eminem', year: 2000 },
  { q: 'Die With A Smile Lady Gaga', year: 2024 },
  { q: "Friday I'm In Love The Cure", year: 1992 },
  { q: 'House of the Rising Sun The Animals', year: 1964 },
  { q: 'Could You Be Loved Bob Marley', year: 1980 },
  { q: 'Static Steve Lacy', year: 2022 },
  { q: 'Suspicious Minds Elvis Presley', year: 1969 },
  { q: 'Adventure of a Lifetime Coldplay', year: 2015 },
  { q: 'Hotel California Eagles', year: 1977 },
  { q: 'Good Vibrations The Beach Boys', year: 1966 },
  { q: 'Dream On Aerosmith', year: 1973 },
  { q: "Stayin' Alive Bee Gees", year: 1977 },
  { q: "Sweet Child O' Mine Guns N' Roses", year: 1988 },
  { q: 'With Or Without You U2', year: 1987 },
  { q: 'Girls Just Want to Have Fun Cyndi Lauper', year: 1983 },
  { q: 'Superstition Stevie Wonder', year: 1972 },
  { q: 'Wish You Were Here Pink Floyd', year: 1975 },
  { q: 'Blue Monday New Order', year: 1983 },
  { q: "Sign 'O' the Times Prince", year: 1987 },
  { q: 'Wonderwall Oasis', year: 1995 },
  { q: 'Killing Me Softly Fugees', year: 1996 },
  { q: 'Under the Bridge Red Hot Chili Peppers', year: 1992 },
  { q: 'Common People Pulp', year: 1995 },
  { q: 'Inside Out Eve 6', year: 1998 },
  { q: 'Seven Nation Army The White Stripes', year: 2003 },
  { q: 'Clocks Coldplay', year: 2002 },
  { q: 'Umbrella Rihanna', year: 2007 },
  { q: "Don't You (Forget About Me) Simple Minds", year: 1985 },
  { q: 'Nutshell Alice In Chains', year: 1994 },
  { q: 'In Da Club 50 Cent', year: 2003 },
  { q: 'Gold Digger Kanye West', year: 2005 },
  { q: 'Fix You Coldplay', year: 2005 },
  { q: 'Shape of You Ed Sheeran', year: 2017 },
  { q: 'Uptown Funk Mark Ronson', year: 2014 },
  { q: 'Somebody That I Used To Know Gotye', year: 2011 },
  { q: 'Stressed Out Twenty One Pilots', year: 2015 },
  { q: 'Shallow Lady Gaga', year: 2018 },
  { q: 'Believer Imagine Dragons', year: 2017 },
  { q: 'Ho Hey The Lumineers', year: 2012 },
  { q: 'Radioactive Imagine Dragons', year: 2012 },
  { q: 'Counting Stars OneRepublic', year: 2013 },
  { q: 'Yeah! USHER', year: 2004 },
  { q: 'Stay With Me Sam Smith', year: 2014 },
  { q: 'Call Me Maybe Carly Rae Jepsen', year: 2011 },
  { q: 'The Pot TOOL', year: 2006 },
  { q: 'Sweater Weather The Neighbourhood', year: 2012 },
  { q: 'Lucid Dreams Juice WRLD', year: 2018 },
  { q: 'Empire State Of Mind JAY-Z', year: 2009 },
  { q: 'I Wanna Be Yours Arctic Monkeys', year: 2013 },
  { q: 'Cornerstone Arctic Monkeys', year: 2009 },
  { q: 'Pyro Kings Of Leon', year: 2010 },
  { q: 'Holding Back the Years Simply Red', year: 1985 },
  { q: 'drop dead Olivia Rodrigo', year: 2023 },
  { q: 'Devil In A New Dress Kanye West', year: 2010 },
  { q: 'Hysteria Muse', year: 2003 },
  { q: 'Eye In The Sky The Alan Parsons Project', year: 1982 },
  { q: 'Heart-Shaped Box Nirvana', year: 1993 },
  { q: 'Smoke On The Water Deep Purple', year: 1972 },
  { q: 'Son Of A Preacher Man Dusty Springfield', year: 1968 },
  { q: 'Heartless Kanye West', year: 2008 },
  { q: 'Under Pressure Queen', year: 1981 },
  { q: 'My Way Frank Sinatra', year: 1969 },
  { q: 'About You The 1975', year: 2023 },
  { q: 'Hey Jude The Beatles', year: 1968 },
  { q: 'Born to Run Bruce Springsteen', year: 1975 },
  { q: 'One Dance Drake', year: 2016 },
  { q: 'Too Sweet Hozier', year: 2024 },
  { q: 'True Spandau Ballet', year: 1983 },
  { q: 'Stairway to Heaven Led Zeppelin', year: 1971 },
  { q: 'Running Up That Hill Kate Bush', year: 1985 },
  { q: 'Lose Yourself Eminem', year: 2002 },
  { q: 'SexyBack Justin Timberlake', year: 2006 },
  { q: 'Shake It Off Taylor Swift', year: 2014 },
  { q: 'Let It Happen Tame Impala', year: 2015 },
  { q: 'Square Hammer Ghost', year: 2016 },
  { q: 'Started From the Bottom Drake', year: 2013 },
  { q: 'Hey Ya! OutKast', year: 2003 },
  { q: 'Demons Imagine Dragons', year: 2012 },
  { q: 'Zombie The Cranberries', year: 1994 },
  { q: 'Someday The Strokes', year: 2001 },
  { q: 'back to friends sombr', year: 2024 },
  { q: 'Self Aware Temper City', year: 2026 },
  { q: 'Dracula Tame Impala', year: 2025 },
  { q: 'Timeless The Weeknd', year: 2024 },
  { q: 'Wrecked Imagine Dragons', year: 2021 },
  { q: 'Navigating Twenty One Pilots', year: 2024 },
  { q: 'I KNOW ? Travis Scott', year: 2023 },
  { q: 'High Speed Coldplay', year: 1999 },
]

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const getDecade = (year: number): string => `${Math.floor(year / 10) * 10 % 100}s`

const seed = async () => {
  console.log('seeding songs...')
  let inserted = 0
  let skipped = 0

  for (const song of songs) {
    try {
      const res = await fetch(
        `https://api.deezer.com/search?q=${encodeURIComponent(song.q)}&limit=1`
      )
      interface DeezerTrack {
        id: number
        title_short: string
        artist: { name: string }
        preview: string
      }
      const data = (await res.json()) as { data?: DeezerTrack[] }

      if (!data.data || data.data.length === 0 || !data.data[0].preview) {
        console.log(`✗ no preview: ${song.q}`)
        skipped++
        continue
      }

      const track = data.data[0]

      const existing = await db
        .selectFrom('songs')
        .select('id')
        .where('deezer_id', '=', String(track.id))
        .executeTakeFirst()

      if (existing) {
        skipped++
        continue
      }

      await db.insertInto('songs').values({
        title: track.title_short,
        artist: track.artist.name,
        year: song.year,
        decade: getDecade(song.year),
        deezer_id: String(track.id),
        preview_url: track.preview,
      }).execute()

      inserted++
      console.log(`✓ ${track.artist.name} — ${track.title_short} (${song.year})`)

      await sleep(200)
    } catch (err) {
      console.error(`✗ failed: ${song.q}`, err)
    }
  }

  console.log(`\ndone! inserted ${inserted}, skipped ${skipped}`)
  await db.destroy()
}

seed()