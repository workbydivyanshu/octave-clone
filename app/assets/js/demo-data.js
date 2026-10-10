/* ==========================================================================
   Octave demo clone — inline demo dataset.
   Authored from the recon copy dumps (copy/*.txt). No network calls, no
   third-party artwork, no API keys of any kind. Cover art is generated at
   runtime (see art.js) from a deterministic per-item gradient + initials.
   ========================================================================== */
(function (root) {
  'use strict';

  /* ---- Songs ------------------------------------------------------------ */
  // e = explicit. dur in seconds.
  const tracks = [
    // Albums
    { id: 't001', title: 'Rusty Intro',            artist: 'Drake',                              album: 'HABIBTI (FOMO)',                    albumId: 'al-habibti', dur: 62,  e: 1, plays: 41 },
    { id: 't002', title: 'WNBA',                   artist: 'Drake',                              album: 'HABIBTI (FOMO)',                    albumId: 'al-habibti', dur: 178, e: 1, plays: 38 },
    { id: 't003', title: 'Slap The City',          artist: 'Drake & Qendresa',                   album: 'HABIBTI (FOMO)',                    albumId: 'al-habibti', dur: 202, e: 1, plays: 33 },
    { id: 't004', title: 'High Fives',             artist: 'Drake',                              album: 'HABIBTI (FOMO)',                    albumId: 'al-habibti', dur: 256, e: 1, plays: 29 },
    { id: 't005', title: 'Hurrr Nor Thurrr',       artist: 'Drake & Sexyy Red',                  album: 'HABIBTI (FOMO)',                    albumId: 'al-habibti', dur: 188, e: 1, plays: 27 },
    { id: 't006', title: "I'm Spent",              artist: 'Drake & Loe Shimmy',                 album: 'HABIBTI (FOMO)',                    albumId: 'al-habibti', dur: 144, e: 1, plays: 25 },
    { id: 't007', title: 'Classic',                artist: 'Drake',                              album: 'HABIBTI (FOMO)',                    albumId: 'al-habibti', dur: 179, e: 1, plays: 24 },
    { id: 't008', title: 'Gen 5',                  artist: 'Drake',                              album: 'HABIBTI (FOMO)',                    albumId: 'al-habibti', dur: 217, e: 1, plays: 22 },
    { id: 't009', title: 'White Bone',             artist: 'Drake',                              album: 'HABIBTI (FOMO)',                    albumId: 'al-habibti', dur: 297, e: 1, plays: 21 },
    { id: 't010', title: 'Fortworth',              artist: 'Drake & PARTYNEXTDOOR',              album: 'HABIBTI (FOMO)',                    albumId: 'al-habibti', dur: 231, e: 1, plays: 20 },
    { id: 't011', title: 'Prioritizing',           artist: 'Drake',                              album: 'HABIBTI (FOMO)',                    albumId: 'al-habibti', dur: 205, e: 1, plays: 19 },
    { id: 't012', title: 'Solar Eclipse',          artist: 'Drake & Don Toliver',                 album: 'HABIBTI (FOMO)',                    albumId: 'al-habibti', dur: 218, e: 0, plays: 18 },
    { id: 't013', title: 'Quebec',                 artist: 'Drake',                              album: 'HABIBTI (FOMO)',                    albumId: 'al-habibti', dur: 130, e: 1, plays: 17 },
    { id: 't014', title: 'Janice STFU',            artist: 'Drake',                              album: 'HABIBTI (FOMO)',                    albumId: 'al-habibti', dur: 237, e: 1, plays: 16 },
    { id: 't015', title: 'Classic PT2',            artist: 'Drake',                              album: 'HABIBTI (FOMO)',                    albumId: 'al-habibti', dur: 149, e: 0, plays: 15 },

    { id: 't101', title: 'The Fate of Ophelia',    artist: 'Taylor Swift',                       album: 'The Life of a Showgirl: The Encore', albumId: 'al-showgirl', dur: 236, e: 0, plays: 14 },
    { id: 't102', title: 'Elizabeth Taylor',       artist: 'Taylor Swift',                       album: 'The Life of a Showgirl: The Encore', albumId: 'al-showgirl', dur: 205, e: 0, plays: 13 },
    { id: 't103', title: 'Opalite',                artist: 'Taylor Swift',                       album: 'The Life of a Showgirl: The Encore', albumId: 'al-showgirl', dur: 235, e: 0, plays: 12 },
    { id: 't104', title: 'Father Figure',          artist: 'Taylor Swift',                       album: 'The Life of a Showgirl: The Encore', albumId: 'al-showgirl', dur: 216, e: 1, plays: 11 },
    { id: 't105', title: 'Eldest Daughter',        artist: 'Taylor Swift',                       album: 'The Life of a Showgirl: The Encore', albumId: 'al-showgirl', dur: 226, e: 1, plays: 10 },
    { id: 't106', title: 'Ruin The Friendship',    artist: 'Taylor Swift',                       album: 'The Life of a Showgirl: The Encore', albumId: 'al-showgirl', dur: 223, e: 1, plays: 9 },
    { id: 't107', title: 'Actually Romantic',      artist: 'Taylor Swift',                       album: 'The Life of a Showgirl: The Encore', albumId: 'al-showgirl', dur: 219, e: 1, plays: 8 },
    { id: 't108', title: 'Wi$h Li$t',             artist: 'Taylor Swift',                       album: 'The Life of a Showgirl: The Encore', albumId: 'al-showgirl', dur: 211, e: 1, plays: 7 },
    { id: 't109', title: 'Wood',                   artist: 'Taylor Swift',                       album: 'The Life of a Showgirl: The Encore', albumId: 'al-showgirl', dur: 215, e: 1, plays: 6 },
    { id: 't110', title: 'CANCELLED!',            artist: 'Taylor Swift',                       album: 'The Life of a Showgirl: The Encore', albumId: 'al-showgirl', dur: 202, e: 1, plays: 5 },
    { id: 't111', title: 'Honey',                  artist: 'Taylor Swift',                       album: 'The Life of a Showgirl: The Encore', albumId: 'al-showgirl', dur: 209, e: 1, plays: 4 },
    { id: 't112', title: 'The Life of a Showgirl', artist: 'Taylor Swift & Sabrina Carpenter',   album: 'The Life of a Showgirl: The Encore', albumId: 'al-showgirl', dur: 224, e: 1, plays: 3 },
    { id: 't113', title: 'Patient Zero',           artist: 'Taylor Swift',                       album: 'The Life of a Showgirl: The Encore', albumId: 'al-showgirl', dur: 225, e: 0, plays: 2 },
    { id: 't114', title: 'Cleveland!',             artist: 'Taylor Swift',                       album: 'The Life of a Showgirl: The Encore', albumId: 'al-showgirl', dur: 213, e: 0, plays: 1 },
    { id: 't115', title: 'Pink Clouding',          artist: 'Taylor Swift',                       album: 'The Life of a Showgirl: The Encore', albumId: 'al-showgirl', dur: 210, e: 0, plays: 1 },
    { id: 't116', title: 'Babylon',                artist: 'Taylor Swift',                       album: 'The Life of a Showgirl: The Encore', albumId: 'al-showgirl', dur: 214, e: 0, plays: 1 },

    // Catalog singles (charts / trending / top hits)
    { id: 't201', title: "Choosin' Texas",            artist: 'Ella Langley',                                 dur: 232, e: 0 },
    { id: 't202', title: 'Boston',                    artist: 'STELLA LEFTY',                                 dur: 170, e: 0 },
    { id: 't203', title: 'I Knew It, I Knew You (From "Toy Story 5")', artist: 'Taylor Swift',         dur: 178, e: 0 },
    { id: 't204', title: 'Be Her',                    artist: 'Ella Langley',                                 dur: 217, e: 0 },
    { id: 't205', title: 'BbY WOW',                   artist: 'KAROL G, Judeline & rusowsky',                  dur: 225, e: 0 },
    { id: 't206', title: 'Dracula (with JENNIE)',     artist: 'Tame Impala',                                  dur: 209, e: 1 },
    { id: 't207', title: 'hate that i made you love me', artist: 'Ariana Grande',                              dur: 198, e: 0 },
    { id: 't208', title: 'Been By Now',               artist: 'Morgan Wallen',                                dur: 213, e: 0 },
    { id: 't209', title: 'stupid song',               artist: 'Olivia Rodrigo',                               dur: 209, e: 0 },
    { id: 't210', title: 'Midnight Sun',              artist: 'Zara Larsson',                                 dur: 189, e: 0 },
    { id: 't211', title: 'Man I Need',                artist: 'Olivia Dean',                                  dur: 184, e: 0 },
    { id: 't212', title: 'So Easy (To Fall In Love)', artist: 'Olivia Dean',                                  dur: 169, e: 0 },
    { id: 't213', title: 'drop dead',                 artist: 'Olivia Rodrigo',                               dur: 225, e: 0 },
    { id: 't214', title: 'Mexico Honey',              artist: 'Kacey Musgraves',                              dur: 223, e: 1 },
    { id: 't215', title: 'Jaded',                     artist: 'Koe Wetzel & Ella Langley',                     dur: 185, e: 0 },
    { id: 't216', title: 'Nicole Kidman',             artist: 'ADÉLA',                                        dur: 181, e: 1 },
    { id: 't217', title: 'Be By You',                 artist: 'Luke Combs',                                   dur: 197, e: 0 },
    { id: 't218', title: 'Empty Words',               artist: 'Corey Kent',                                   dur: 152, e: 0 },
    { id: 't219', title: 'Phone, Keys, Wallet',       artist: 'Lainey Wilson & John Mayer',                    dur: 172, e: 0 },
    { id: 't220', title: 'Think As You Drunk',        artist: 'Riley Green',                                  dur: 227, e: 0 },
    { id: 't221', title: "Don't We",                  artist: 'Morgan Wallen',                                dur: 191, e: 0 },
    { id: 't222', title: 'Good News',                 artist: 'Shaboozey',                                    dur: 199, e: 0 },
    { id: 't223', title: 'Loving Life Again',         artist: 'Ella Langley',                                 dur: 226, e: 0 },
    { id: 't224', title: 'Take Me Back (Leave Me There)', artist: 'Cody Johnson',                              dur: 178, e: 0 },
    { id: 't225', title: 'Something To Lose',         artist: 'STELLA LEFTY & Vincent Mason',                  dur: 175, e: 0 },
    { id: 't226', title: "I Can't Love You Anymore",  artist: 'Ella Langley & Morgan Wallen',                 dur: 228, e: 0 },
    { id: 't227', title: 'Overrated',                 artist: 'Warren Zeiders & Bellah Mae',                   dur: 186, e: 0 },
    { id: 't228', title: 'Medicine',                  artist: 'Megan Moroney',                                dur: 191, e: 0 },
    { id: 't229', title: 'Cowgirl',                   artist: 'Shaboozey',                                    dur: 175, e: 1 },
    { id: 't230', title: 'Kid Myself',                artist: 'John Morgan',                                  dur: 209, e: 0 },
    { id: 't231', title: 'Woman',                     artist: 'Kane Brown',                                   dur: 166, e: 0 },
    { id: 't232', title: 'Country And She Knows It',  artist: 'Luke Bryan',                                   dur: 174, e: 0 },
    { id: 't233', title: 'McArthur',                  artist: 'HARDY, Eric Church, Morgan Wallen & Tim McGraw', dur: 231, e: 0 },
    { id: 't234', title: 'All My Exes',               artist: 'Lauren Alaina & Chase Matthew',                 dur: 173, e: 0 },
    { id: 't235', title: 'Better Me For You (Brown Eyes)', artist: 'Max McNown',                               dur: 194, e: 0 },
    { id: 't236', title: 'Carry On',                  artist: 'Kenny Chesney',                                dur: 180, e: 0 },
    { id: 't237', title: 'Hands Up',                  artist: 'Jelly Roll',                                   dur: 194, e: 0 },
    { id: 't238', title: 'What You Want',             artist: 'Vincent Mason',                                dur: 172, e: 0 },
    { id: 't239', title: 'I Never Lie',               artist: 'Zach Top',                                     dur: 224, e: 0 },
    { id: 't240', title: "Livin' On A Prayer",       artist: 'Bon Jovi',                                     dur: 249, e: 0 },
    { id: 't241', title: 'A Bar Song (Tipsy)',        artist: 'Shaboozey',                                    dur: 171, e: 1 },
    { id: 't242', title: 'Dai Dai',                   artist: 'Shakira & Burna Boy',                           dur: 223, e: 0 },
    { id: 't243', title: 'Bell Bottoms Up',           artist: 'Lainey Wilson',                                 dur: 213, e: 0 },
    { id: 't244', title: 'I Had Some Help',           artist: 'Post Malone & Morgan Wallen',                   dur: 178, e: 1 },
    { id: 't245', title: 'Good Girls & Cowgirls',     artist: 'Zach Top',                                     dur: 184, e: 0 },
    { id: 't246', title: 'Folded',                    artist: 'Kehlani',                                      dur: 238, e: 0 },
    { id: 't247', title: 'Memo',                      artist: 'Dasha',                                        dur: 191, e: 0 },
    { id: 't248', title: 'Your Love',                 artist: 'The Outfield',                                 dur: 222, e: 0 },
    { id: 't249', title: "Nothin' Better To Do",      artist: 'Carter Faith & Wyatt Flores',                   dur: 182, e: 0 },
    { id: 't250', title: 'Dancing In the Dark',        artist: 'Bruce Springsteen',                            dur: 241, e: 0 },
    { id: 't251', title: 'Juna',                      artist: 'Clairo',                                       dur: 195, e: 0 },
    { id: 't252', title: 'Ordinary',                  artist: 'Alex Warren',                                  dur: 186, e: 0 },
    { id: 't253', title: 'Who Told You That',          artist: 'Tucker Wetmore',                                dur: 205, e: 0 },
    { id: 't254', title: 'What I Want',               artist: 'Morgan Wallen & Tate McRae',                    dur: 184, e: 0 },
    { id: 't255', title: 'Clothesline',               artist: 'Dylan Gossett',                                dur: 207, e: 0 },
    { id: 't256', title: 'Another Drink',             artist: 'Marshmello & Kelsea Ballerini',                 dur: 153, e: 1 },
    { id: 't257', title: 'Move On',                   artist: 'Kevin Powers & Shaboozey',                     dur: 191, e: 0 },
    { id: 't258', title: 'No Broke Boys',             artist: 'Disco Lines & Tinashe',                         dur: 163, e: 1 },
    { id: 't259', title: 'No One Noticed',            artist: 'The Marías',                                   dur: 236, e: 0 },
    { id: 't260', title: 'Opalite',                   artist: 'Taylor Swift',                                 dur: 235, e: 0 },
    { id: 't261', title: 'I Know I Know',             artist: 'STELLA LEFTY',                                 dur: 159, e: 0 },
    { id: 't262', title: 'Am I Okay?',                artist: 'Megan Moroney',                                dur: 235, e: 0 },
    { id: 't263', title: 'Last One To Know',          artist: 'Gavin Adcock',                                 dur: 177, e: 0 },
    { id: 't264', title: 'Go Again',                  artist: 'Riley Green & Hannah McFarland',                dur: 240, e: 0 },
    { id: 't265', title: 'Show Me Love',              artist: 'WizTheMc & bees & honey',                      dur: 177, e: 0 },
    { id: 't266', title: 'Burning Blue',              artist: 'Mariah The Scientist',                         dur: 205, e: 0 },
    { id: 't267', title: "What He'll Never Have",     artist: 'Dylan Scott',                                  dur: 153, e: 0 },
    { id: 't268', title: 'Savage Love',               artist: 'Laxed · S1mba',                                dur: 168, e: 1 },
    { id: 't269', title: 'Heat Waves',                artist: 'Glass Animals',                                dur: 239, e: 0 },
    { id: 't270', title: 'Sunflower',                 artist: 'Rex Orange County',                            dur: 158, e: 0 },
    { id: 't271', title: 'the cure',                  artist: 'Olivia Rodrigo',                               dur: 205, e: 0 },
    { id: 't272', title: 'expectations',              artist: 'Olivia Rodrigo',                               dur: 190, e: 1 },
    { id: 't273', title: 'maggots for brains',        artist: 'Olivia Rodrigo',                               dur: 178, e: 1 },
    { id: 't274', title: 'Sunglasses',                artist: 'Tinashe',                                      dur: 205, e: 1 },
    { id: 't275', title: 'Too Easy',                  artist: 'Tinashe',                                      dur: 187, e: 1 },
    { id: 't276', title: 'Nobody Wanna Dance Anymore', artist: 'Tinashe',                                    dur: 196, e: 1 },
    { id: 't277', title: 'Crash Out',                 artist: 'Tinashe',                                      dur: 202, e: 1 },
    { id: 't278', title: 'Stateside',                 artist: 'PinkPantheress',                               dur: 214, e: 1 },
    { id: 't279', title: 'Duvet',                     artist: 'bôa',                                          dur: 249, e: 0 },
    { id: 't280', title: "Ain't In LA",               artist: 'ADÉLA',                                        dur: 186, e: 1 },
    { id: 't281', title: 'Heaven Baby',               artist: 'Ayra Starr & ZAYN',                            dur: 205, e: 0 },
    { id: 't282', title: 'Build a Bitch',             artist: 'Future',                                       dur: 222, e: 1 },
    { id: 't283', title: 'Cold Shoulder',             artist: 'Drake & Yebba',                                dur: 214, e: 0 },
    { id: 't284', title: 'Dance With Me',             artist: 'Bruno Mars',                                   dur: 229, e: 0 },
    { id: 't285', title: 'CATastrophe',               artist: 'Hilary Duff',                                  dur: 178, e: 0 },
    { id: 't286', title: 'Comfort',                   artist: 'Mr Eazi & MOLIY',                              dur: 195, e: 0 },
    { id: 't287', title: 'Text',                      artist: 'Fridayy',                                      dur: 183, e: 0 },
    { id: 't288', title: 'Summer Clothes',            artist: 'Michael Kiwanuka',                             dur: 221, e: 0 },
    { id: 't289', title: "Mr Charm",                  artist: 'The Rolling Stones',                           dur: 198, e: 0 },
    { id: 't290', title: 'Kiss The Ring',             artist: 'Mollie Elizabeth',                             dur: 186, e: 0 },
    { id: 't291', title: 'Set Of Keys',              artist: 'Fat Joe, Pusha T & Dre',                        dur: 208, e: 0 },
    { id: 't292', title: "World's Greatest!",        artist: 'Lil Nas X',                                    dur: 179, e: 0 },
    { id: 't293', title: "Prettiest Thing I’ve Ever Seen", artist: 'LANY',                                    dur: 192, e: 0 },
    { id: 't294', title: "I Won’t Cry",               artist: 'Remi Wolf',                                    dur: 194, e: 0 },
    { id: 't295', title: 'Great Expectation',         artist: 'SIENNA SPIRO',                                 dur: 189, e: 0 },
    { id: 't296', title: 'Man I Need',                artist: 'Olivia Dean',                                  dur: 184, e: 0 },
    { id: 't297', title: 'Last Thing You Need (from GTAVI: The Album)', artist: 'Morgan Wallen', dur: 216, e: 0 },
    { id: 't298', title: "Earrings",                  artist: 'Malcolm Todd',                                 dur: 188, e: 0 },
    { id: 't299', title: 'God’s Plan',                artist: 'Drake',                                        dur: 198, e: 1 },
    { id: 't300', title: 'Hotline Bling',             artist: 'Drake',                                        dur: 257, e: 1 },
    { id: 't301', title: 'Chelsea Boo...',            artist: 'Paul McCartney',                              dur: 177, e: 0 },
    { id: 't302', title: 'Paradise',                  artist: 'Gloee, Chlöe',                                 dur: 164, e: 1 },
    { id: 't303', title: 'Sinful Obsession',           artist: 'The Drop - Casa',                              dur: 183, e: 0 },
    { id: 't304', title: 'Uncertain, T...',           artist: 'Kacey Musgrave',                               dur: 213, e: 0 },
    { id: 't305', title: 'Dead Comp...',              artist: 'Royal Blood',                                  dur: 199, e: 0 },
    { id: 't306', title: 'WAIT FOR U (feat. Drake & Tems)', artist: 'Future',                                dur: 189, e: 1 },
    { id: 't307', title: 'Shabang',                   artist: 'Drake',                                        dur: 154, e: 1 },
    { id: 't308', title: 'Ahí',                       artist: 'KAROL G & Drake',                              dur: 188, e: 1 },
    { id: 't309', title: 'P power (feat. Drake)',     artist: 'Gunna',                                        dur: 175, e: 1 },
    { id: 't310', title: 'She Will',                  artist: 'Drake',                                        dur: 190, e: 1 },
    { id: 't311', title: "She's the Best",            artist: 'Troye Sivan',                                  dur: 198, e: 0 },
    { id: 't312', title: 'How To Quit Smoking',       artist: 'Dominic Fike',                                 dur: 205, e: 0 },
    { id: 't313', title: 'R&B Now',                   artist: 'R&B',                                          dur: 240, e: 0 },
    { id: 't314', title: 'Leaning',                   artist: 'Lithe',                                        dur: 192, e: 0 },
    { id: 't315', title: 'Mosquito',                  artist: 'Lola Young',                                   dur: 203, e: 0 }
  ];

  /* ---- Albums ----------------------------------------------------------- */
  const albums = [
    {
      id: 'al-habibti', title: 'HABIBTI (FOMO)', artist: 'Drake',
      genre: 'R&B', year: 2026, lossless: true, plays: 41,
      tagline: '& other nicknames I call my dear city',
      blurb:
        "What's a girl gonna do after the record-smashing Eras Tour? Well, its success sparked the flame inside Taylor Swift that led to a reunion with former collaborators Max Martin and Shellback for her 12th full-length, The Life of a Showgirl.",
      footer: '15 songs, 49 min · October 2, 2026',
      label: 'OVO/Republic',
      copyright: '℗ 2026 OVO, under exclusive license to Republic Records, a division of UMG Recordings, Inc.',
      otherVersions: [
        { title: 'HABIBTI (FOMO)', note: 'Clean Version · 2026' },
        { title: 'HABIBTI', note: 'Explicit Version · 2026' },
        { title: 'HABIBTI', note: 'Clean Version · 2026' }
      ]
    },
    {
      id: 'al-showgirl', title: 'The Life of a Showgirl: The Encore', artist: 'Taylor Swift',
      genre: 'Pop', year: 2026, lossless: true, plays: 14,
      tagline: 'NEW RELEASE',
      blurb:
        "Swift flew back and forth to Sweden between stops on her European leg — remember, the singer-songwriter believes “jet lag is a choice” — to join Martin and Shellback, Swift's co-writers and producers on some of the most memorable and popular hits of her career. The result? A confident, dazzling, at times elegant, at times cheeky, at times sensual pop explosion.",
      footer: '16 songs, 55 min · September 25, 2026',
      label: 'Taylor Swift',
      copyright: '℗ 2026 Taylor Swift',
      otherVersions: []
    }
  ];

  /* ---- Artists ---------------------------------------------------------- */
  const artists = [
    { id: 'ar-drake',  name: 'Drake',              sub: 'Hip-Hop/Rap', fans: '24.1M fans', adamId: '246791' },
    { id: 'ar-taylor', name: 'Taylor Swift',       sub: 'Pop',         fans: '119M fans',  adamId: '159260351' },
    { id: 'ar-olivia', name: 'Olivia Rodrigo',     sub: 'Pop',         fans: '31.4M fans', adamId: '979458609' },
    { id: 'ar-adela',  name: 'ADÉLA',              sub: 'Pop',         fans: '2.1M fans',  adamId: '1477373055' },
    { id: 'ar-tinashe',name: 'Tinashe',            sub: 'R&B',         fans: '3.6M fans',  adamId: '460642737' },
    { id: 'ar-ella',   name: 'Ella Langley',       sub: 'Country',     fans: '4.4M fans',  adamId: '1461913802' },
    { id: 'ar-karolg', name: 'KAROL G',            sub: 'Urbano latino',fans: '31.6M fans', adamId: '1153535382' },
    { id: 'ar-dontol', name: 'Don Toliver',        sub: 'Hip-Hop/Rap', fans: '5.2M fans',  adamId: '1499378108' },
    { id: 'ar-morgan', name: 'Morgan Wallen',      sub: 'Country',     fans: '22.1M fans', adamId: '1286848113' },
    { id: 'ar-brit',   name: 'Brittany Howard',    sub: 'Alternative', fans: '3.3M fans',  adamId: '1062009120' }
  ];

  const artistTopSongs = [
    't012', 't013', 't306', 't283', 't014', 't299', 't307', 't010', 't007', 't006', 't308', 't309', 't310'
  ];

  /* ---- Playlists -------------------------------------------------------- */
  const playlists = [
    { id: 'pl-liked', title: 'Liked Songs', subtitle: 'Pinned · Playlist', pinned: true, count: 0, kind: 'liked' },
    { id: 'pl-november', title: 'November Warmers', subtitle: 'Playlist · 24 songs', count: 24, kind: 'playlist' },
    { id: 'pl-commute', title: 'Commute', subtitle: 'Playlist · 38 songs', count: 38, kind: 'playlist' }
  ];

  /* ---- Radio ------------------------------------------------------------ */
  const stations = [
    { id: 'st1', name: 'Apple Music 1',     badge: 'EXCLUSIVE', slot: '3:00 – 5:00 AM', desc: "The world’s best new music is on Apple Music 1.", excl: true },
    { id: 'st2', name: 'Apple Music Hits',  badge: 'LISTEN NOW', slot: '3:00 – 5:00 AM', desc: 'Songs you know and love.' },
    { id: 'st3', name: 'Apple Music Country', badge: 'LISTEN NOW', slot: '3:00 – 5:00 AM', desc: 'Where it sounds like home.' },
    { id: 'st4', name: 'Apple Música Uno',  badge: 'LISTEN NOW', slot: '3:00 – 5:00 AM', desc: 'La cultura que te mueve.' },
    { id: 'st5', name: 'Apple Music Club',  badge: 'LISTEN NOW', slot: '3:00 – 5:00 AM', desc: 'NAINA soundtracks your day.' },
    { id: 'st6', name: 'Apple Music Chill', badge: 'LISTEN NOW', slot: '3:00 – 5:00 AM', desc: 'Listen and let go.' }
  ];

  const editorialRadio = [
    'SOULECTION', 'Rocket Hour', '5 on Fridays with Vince Staples', 'Time Crisis',
    'The Mark Hoppus Show', 'The Estelle Show', 'Radio Takeover', 'FANCY',
    'NAINA Presents', 'Beats in Space with Tim Sweeney', 'What Would Dolly Do? Radio',
    'Level Up Radio', 'Max Richter’s Songs of a Jumping Universe',
    'The ’90s Country Show with Riley Green', 'ARMY Radio',
    'Chemistry Radio with Chris Lake', 'Young Money Radio'
  ];

  /* ---- Genres / moods --------------------------------------------------- */
  const genres = [
    'Pop', 'Hip-Hop', 'R&B', 'Rock', 'Jazz', 'Classical', 'Electronic', 'Indie',
    'Country', 'Folk & Acoustic', 'Blues', 'Metal', 'K-Pop', 'Latin', 'Classical Period',
    'Alternative', 'Ambient', 'Worldwide', 'Reggae', 'Hip-Hop/Rap', 'Urbano latino',
    'Pop Latino', 'Musique Galloise', 'Musique Bas_canienne', 'Singer/Songwriter',
    'Musique Fran_aise', 'Musique Afropean', 'Music Videos', 'Children', 'Soundtrack'
  ];

  const moodCategories = [
    { label: 'HEAD TRIP', hue: 268 },
    { label: 'Halloween', hue: 118 },
    { label: 'Live Music', hue: 22 },
    { label: 'Charts', hue: 88 },
    { label: 'Exclusives', hue: 310 },
    { label: 'Radio', hue: 348 },
    { label: 'Concerts near you', hue: 200 }
  ];

  const searchCategories = [
    'Live Music', 'Hits', 'Pop', 'Hip-Hop', 'Country', 'Dance', 'Rock', 'Latin',
    'R&B', 'HEAD TRIP', 'Halloween', 'Radio', 'Exclusives', 'Charts', 'K-Pop',
    'Urbano Latino', 'Pop Latino', 'Classic Rock', 'Hard Rock', 'Metal', 'Oldies',
    'Americana', 'Música Mexicana', 'Alternative', 'Acoustic', 'Afrobeats', 'Reggae',
    'Worldwide', 'Kids', 'Family', 'Electronic', 'DJ Mixes', 'Indie', 'Christian',
    'Gospel', 'Jazz', 'Blues', 'Music Videos', 'Soul/Funk', 'Classical',
    'Film, TV & Stage', 'Anime', 'Alpha Women', 'Essentials', 'Decades',
    'Behind the Songs', 'Sports', 'Fitness', 'Chill', 'Sleep', 'Wellbeing',
    'Concerts near you'
  ];

  /* ---- Podcasts --------------------------------------------------------- */
  const podcastEditorial = [
    { kind: 'NEW SEASON', title: 'The trial ended in a hung jury. But the story is far from over.', href: 'episode.html', show: 'Beyond All Repair: The Clancy Trial' },
    { kind: 'NEW SEASON', title: 'Is foul play to blame for a series of mysterious deaths?', href: 'podcast-show.html', show: 'Dateline NBC' },
    { kind: 'FEATURED COLLECTION', title: 'Halloween horrors that give you the creeps. Enter if you dare...', href: 'podcasts-charts.html', show: '' },
    { kind: 'VOTE 2026', title: 'Election coverage: the races, the issues, and how to cast a vote.', href: 'podcasts.html', show: '' },
    { kind: 'NEW SEASON', title: 'A real-time investigation into a missing American journalist.', href: 'podcasts.html', show: '' },
    { kind: 'NEW EPISODE', title: 'Troye Sivan talks through his new album, She’s the Best.', href: 'podcasts.html', show: '' },
    { kind: 'NEW SERIES', title: 'Investigating what AI is doing to music and those who love it.', href: 'podcast-show.html', show: 'Light Box' },
    { kind: 'NEW SHOW', title: 'Interviews about moments in life when everything changes.', href: 'podcasts.html', show: '' },
    { kind: 'NEW EPISODE', title: 'Olivia Rodrigo breaks down her chart-topping song "The Cure."', href: 'podcasts.html', show: '' },
    { kind: 'FEATURED SHOW', title: 'Centering Latino experiences and in-depth stories in the US.', href: 'podcasts.html', show: '' },
    { kind: 'NEW EPISODE', title: 'The bizarre mystery behind a fake Florida news site.', href: 'podcasts.html', show: '' },
    { kind: 'NEW EPISODE', title: 'Ben Affleck joins Kerry to talk about their new film Animals.', href: 'podcasts.html', show: '' },
    { kind: 'FEATURED EPISODE', title: 'Jessica Chastain on creative risks and Other Mommy.', href: 'podcasts.html', show: '' }
  ];

  const podcastGenres = [
    { label: 'Series', color: '#ff3b30' },
    { label: 'Comedy', color: '#ff9500' },
    { label: 'True Crime', color: '#5856d6' },
    { label: 'Society & Culture', color: '#ff2d55' },
    { label: 'Sports', color: '#34c759' },
    { label: 'News', color: '#0a84ff' },
    { label: 'Kids & Family', color: '#30d158' },
    { label: 'Climate', color: '#1fd45c' }
  ];

  const shows = [
    { id: 'ps-daily',  title: 'The Daily',                      publisher: 'The New York Times' },
    { id: 'ps-junkie', title: 'Crime Junkie',                    publisher: 'Audiochuck' },
    { id: 'ps-rogan',  title: 'The Joe Rogan Experience',        publisher: 'Joe Rogan', e: 1 },
    { id: 'ps-dark',   title: 'In The Dark',                    publisher: 'The New Yorker' },
    { id: 'ps-dateline',title: 'Dateline NBC',                   publisher: 'NBC News' },
    { id: 'ps-poehler',title: 'Good Hang with Amy Poehler',     publisher: 'The Ringer' },
    { id: 'ps-npr',    title: 'Up First from NPR',              publisher: 'NPR' },
    { id: 'ps-morbid', title: 'Morbid',                         publisher: 'Ash Kelley & Alaina Urquhart', e: 1 },
    { id: 'ps-reach',  title: 'Reaching Out',                   publisher: 'Futuro Media' },
    { id: 'ps-shawn',  title: 'The Shawn Ryan Show',            publisher: 'Shawn Ryan', e: 1 },
    { id: 'ps-pardon', title: 'Pardon My Take',                 publisher: 'Barstool Sports', e: 1 },
    { id: 'ps-toast',  title: 'The Toast Media Podcast',        publisher: 'Dear Media' },
    { id: 'ps-journey',title: 'The Journey',                    publisher: 'The Clever' },
    { id: 'ps-megyn',  title: 'The Megyn Kelly Podcast',        publisher: 'SiriusXM' },
    { id: 'ps-lightbox',title: 'Light Box',                     publisher: 'Mark Henry Phillips & Radiotopia', href: 'podcast-show.html' },
    { id: 'ps-clancy', title: 'Beyond All Repair: The Clancy Trial', publisher: 'WBUR', href: 'episode.html' }
  ];

  const podcastChartCategories = [
    'All Categories', 'News', 'Comedy', 'Society & Culture', 'Business', 'True Crime',
    'Sports', 'Health & Fitness', 'Religion & Spirituality', 'Arts', 'Education',
    'History', 'TV & Film', 'Science', 'Technology', 'Music', 'Kids & Family',
    'Leisure', 'Fiction', 'Government'
  ];

  const episodesLightBox = [
    { date: 'Sep 15', code: 'S1, E1', title: '1. Inside the Black Box', dur: '49m',
      blurb: "Composer Mark Henry Phillips logs onto an AI music generator expecting slop. Instead... he has an existential crisis. What it made wasn't slop -- it was good. Really good. This plunges him into a year-and-a-half long rabbit hole." },
    { date: 'Sep 22', code: 'S1, E2', title: '2. The Hit Factory (Part I: No Songs Left Behind)', dur: '52m',
      blurb: "There's already a #1 hit made with AI. You just don't know which one. In this episode, we go inside the world of professional songwriting camps -- where hits for the biggest artists are assembled by rooms of strangers." },
    { date: 'Sep 29', code: 'S1, E3', title: '3. The Hit Factory (Part II: Steal From Everyone)', dur: '42m',
      blurb: "A producer with 13 billion streams posts on Reddit about how much he loves making music with AI and... gets banned. We have the conversation that wasn't allowed there." },
    { date: 'Sep 29', code: 'S1, E4', title: '4. The Critic (Marc Ribot)', dur: '42m',
      blurb: "Marc Ribot has played guitar for Tom Waits, Elvis Costello, Norah Jones, Robert Plant, and about a thousand other people. He's also one of the most outspoken critics of AI music. He calls Suno and Udio plagiarism machines." },
    { date: '2d ago', code: 'S1, E5', title: '5. Slop (Who Is This For?)', dur: '56m',
      blurb: "A year ago, I was driving my daughter home from preschool when Spotify autoplayed a song that cut out mid-note. It was AI, and whoever made it hadn't bothered to fix the ending. So I tracked down the 19-year-old behind it." }
  ];

  const episodesTrailers = [
    { date: 'Sep 1', code: 'Season 1 Trailer', title: 'Trailer', dur: '1m',
      blurb: "Listen to LIGHT BOX, the new show from PRX's Radiotopia. Out now! Mark Henry Phillips spent twenty years composing music for a living. Then one night he typed a few words into an AI music generator." },
    { date: 'Sep 8', code: 'Season 1 Trailer', title: 'Teaser', dur: '4m',
      blurb: "A sneak peek at what's coming this season on Light Box, the new show from PRX's Radiotopia. Launching September 15." }
  ];

  const lightBoxInfo = [
    ['Channel', 'Radiotopia'], ['Creator', 'Mark Henry Phillips & Radiotopia'],
    ['Years Active', '2026'], ['Episodes', '7'], ['Rating', 'Clean'],
    ['Frequency', 'Weekly Series'], ['Copyright', '© 2026'],
    ['Show Website', 'lightboxpodcast.com'], ['RSS Feed', 'publicfeeds.net']
  ];

  const clancyChapters = [
    ['0:00', 'Introduction', '4m'], ['4:10', 'Tragic Events Unfold', '6m'],
    ['9:55', 'Legal Battle Begins', '9m'], ['18:55', 'Postpartum Mental Health', '2m'],
    ['21:17', 'Jury Deliberation', '10m'], ['31:15', 'Mistrial Outcome', '1m']
  ];

  const clancyDescription = [
    "WBUR reporter Deborah Becker spent many of her days this summer at the Plymouth County courthouse. She's been covering the trial of Lindsay Clancy, who was charged with murdering her three children before attempting to kill herself.",
    "The Massachusetts woman's defense argued she was experiencing postpartum psychosis at the time and should not be held criminally responsible for her actions. After weeks of testimony and seven days of deliberation, the jury was deadlocked.",
    "The tragedy at the center of the case is unbelievable — a mother killing her children. But what is also remarkable about this case is how it's captivated the public and drawn immense support for the woman on trial.",
    "Now, everyone is looking for some type of closure to this harrowing case."
  ];

  /* ---- Settings copy ---------------------------------------------------- */
  const settingsSections = [
    'Account & sync', 'Notifications', 'Library', 'Audio', 'Equalizer', 'Playback',
    'Keyboard', 'Recommendations', 'Downloads', 'Storage', 'Lyrics', 'Animated Art',
    'Appearance', 'Gestures', 'Search', 'Sleep Timer', 'Listening History',
    'Connections', 'About'
  ];

  const shortcuts = [
    {
      g: 'FILE', rows: [
        { l: 'New Playlist', c: ['Ctrl', 'N'], alt: ['Ctrl', 'Win', 'N'] },
        { l: 'Playlist from Selection', c: ['Ctrl', 'Shift', 'N'], alt: ['Ctrl', 'Win', 'Shift', 'N'] },
        { l: 'New Smart Playlist', c: ['Ctrl', 'Alt', 'N'] },
        { l: 'Import…', c: ['Ctrl', '0'] }
      ]
    },
    {
      g: 'SONG', rows: [
        { l: 'Get Info', c: ['Ctrl', 'I'] },
        { l: 'Favorite', c: ['L'] }
      ]
    },
    {
      g: 'VIEW', rows: [
        { l: 'Show View Options', c: ['Ctrl', 'J'] },
        { l: 'Show Filter Field', c: ['Ctrl', 'Alt', 'F'] },
        { l: 'Show Column Browser', c: ['Ctrl', 'B'] },
        { l: 'Show Playing Next', c: ['Ctrl', 'Alt', 'U'], alt: ['Q'] },
        { l: 'Show Lyrics', c: ['Ctrl', 'Win', 'U'] }
      ]
    },
    {
      g: 'CONTROLS', rows: [
        { l: 'Play / Pause', c: ['Space'] },
        { l: 'Stop', c: ['Ctrl', '.'] },
        { l: 'Next Track', c: ['Ctrl', '→'], alt: ['→'] },
        { l: 'Previous Track', c: ['Ctrl', '←'], alt: ['←'] },
        { l: 'Skip forward', c: ['Ctrl', 'Alt', '→'], alt: ['Shift', '→'] },
        { l: 'Skip backward', c: ['Ctrl', 'Alt', '←'], alt: ['Shift', '←'] },
        { l: 'Go to Current Song', c: ['Ctrl', 'Win', 'L'], alt: ['Ctrl', 'L'],
          note: '⌘L is the address bar in every browser, so Octave uses ⌃⌘L.' },
        { l: 'Increase Volume', c: ['Ctrl', '↑'], alt: ['Shift', '↑'] },
        { l: 'Set Volume to Maximum', c: ['Ctrl', 'Shift', '↑'] },
        { l: 'Decrease Volume', c: ['Ctrl', '↓'], alt: ['Shift', '↓'] },
        { l: 'Set Volume to Minimum', c: ['Ctrl', 'Shift', '↓'] },
        { l: 'Mute / Unmute', c: ['M'] },
        { l: 'Shuffle', c: ['S'] },
        { l: 'Repeat', c: ['R'] },
        { l: 'Back', c: ['Ctrl', '['] },
        { l: 'Next Item (Forward)', c: ['Ctrl', ']'], alt: ['Ctrl', 'Shift', ']'],
          note: '⇧⌘] switches tabs in every browser, so Octave uses ⌘] — the browser’s own Forward.' }
      ]
    },
    {
      g: 'WINDOW', rows: [
        { l: 'Full Screen Player', c: ['Ctrl', 'Shift', 'F'], alt: ['N'] },
        { l: 'Switch to MiniPlayer', c: ['Ctrl', 'Shift', 'M'], alt: ['Ctrl', 'Alt', 'M'] },
        { l: 'Equalizer', c: ['Ctrl', 'Alt', 'E'] },
        { l: 'Activity (Downloads)', c: ['Ctrl', 'Alt', 'L'] }
      ]
    },
    {
      g: 'HELP', rows: [
        { l: 'Keyboard Shortcuts', c: ['?'], alt: ['Ctrl', '?'],
          note: '⌘? is the macOS Help menu in every app, so Octave uses ?' }
      ]
    },
    {
      g: 'GO', rows: [
        { l: 'Go to Search', c: ['Ctrl', 'F'], alt: ['/'] },
        { l: 'Go to Home', c: ['Ctrl', 'Alt', '1'] },
        { l: 'Go to New', c: ['Ctrl', 'Alt', '2'] },
        { l: 'Go to Radio', c: ['Ctrl', 'Alt', '3'] },
        { l: 'Go to Recently Added', c: ['Ctrl', 'Win', '1'] },
        { l: 'Go to Artists', c: ['Ctrl', 'Win', '2'] },
        { l: 'Go to Albums', c: ['Ctrl', 'Win', '3'] },
        { l: 'Go to Songs', c: ['Ctrl', 'Win', '4'] },
        { l: 'Go to Genres', c: ['Ctrl', 'Win', '5'] },
        { l: 'Go to Composers', c: ['Ctrl', 'Win', '6'] },
        { l: 'Settings…', c: ['Ctrl', ','] }
      ]
    }
  ];

  /* ---- Static synced lyrics (demo) ------------------------------------- */
  const lyrics = {
    t012: [
      [0.0,  'Solar eclipse'],
      [3.4,  'Over Toronto, the city lights'],
      [6.9,  'Fold into one another'],
      [10.2, 'Every shadow has a twin'],
      [13.8, 'And the night keeps moving'],
      [17.1, 'Pull me closer, hold the line'],
      [20.6, "I'm yours until the morning"],
      [24.0, 'Solar eclipse'],
      [27.5, 'Burning slow on the horizon'],
      [31.0, 'Gold dissolving into dark'],
      [34.4, 'Nothing here is accidental'],
      [37.9, 'Every second leaves a mark'],
      [41.3, 'Solar eclipse'],
      [44.8, 'Turn the night into a promise'],
      [48.2, 'We were always meant to land'],
      [51.6, 'Demo lyric line — synthesized clock']
    ],
    t013: [
      [0.0,  'Quebec, Québec'],
      [4.2,  'Where the language bends'],
      [8.1,  'And the winters carry news'],
      [12.0, 'Of the ones who stayed'],
      [16.4, 'Montréal to Gaspé'],
      [20.1, 'Everything I know'],
      [24.0, 'Demo lyric line — synthesized clock']
    ],
    t201: [
      [0.0,  "Choosin' Texas"],
      [3.8,  'Rodeo nights and radio towers'],
      [7.6,  'Neon on the dashboard glow'],
      [11.3, "Ain't no tellin' where we'll go"],
      [15.0, "But we're choosin' Texas"],
      [19.2, 'Demo lyric line — synthesized clock']
    ],
    t279: [
      [0.0,  'Duvet'],
      [5.0,  'I just wanted to'],
      [9.4,  'be happy'],
      [14.1, 'in your duvet'],
      [19.0, 'when the lights were out'],
      [24.5, 'Demo lyric line — synthesized clock']
    ]
  };

  /* ---- Home shelves ----------------------------------------------------- */
  const trending = [
    ['Nicole Kidman', 'ADÉLA'], ["Ain't In LA", 'ADÉLA'], ['the cure', 'Olivia Rodrigo'],
    ['stupid song', 'Olivia Rodrigo'], ['Melatonin', 'Tinashe'], ['Earrings', 'Malcolm Todd'],
    ['expectations', 'Olivia Rodrigo'], ['drop dead', 'Olivia Rodrigo'],
    ['maggots for brains', 'Olivia Rodrigo'], ['Sunglasses', 'Tinashe'],
    ['Too Easy', 'Tinashe'], ['Nobody Wanna Dance Anymore', 'Tinashe'],
    ['Crash Out', 'Tinashe'], ['Stateside', 'PinkPantheress'],
    ['hate that i made you love me', 'Ariana Grande'], ['Duvet', 'bôa']
  ];

  const newMusic = [
    ['Heaven Baby', 'Ayra Starr & ZAYN'], ['Build a Bitch', 'Future'],
    ['Patient Zero (Expanded Video)', 'Taylor Swift'], ['Solar Eclipse', 'Drake & Don Toliver'],
    ['Quebec', 'Drake'], ['Cold Shoulder', 'Drake & Yebba'], ['Dance With Me', 'Bruno Mars'],
    ['CATastrophe', 'Hilary Duff'], ['Leaning', 'Lithe'], ['Comfort', 'Mr Eazi & MOLIY'],
    ['Text', 'Fridayy'], ['Summer Clothes', 'Michael Kiwanuka'], ['Mr Charm', 'The Rolling Stones'],
    ['Kiss The Ring', 'Mollie Elizabeth'], ['Set Of Keys', 'Fat Joe, Pusha T & Dre'],
    ["World's Greatest!", 'Lil Nas X'], ['Prettiest Thing I’ve Ever Seen', 'LANY'],
    ['I Won’t Cry', 'Remi Wolf']
  ];

  const cities = [
    'New York City', 'Los Angeles', 'Atlanta', 'Nashville', 'Miami', 'Chicago',
    'Houston', 'San Juan', 'San Francisco', 'Seattle', 'Washington, D.C.', 'Austin',
    'Accra', 'Almaty', 'Auckland', 'Toronto'
  ];

  const editorialNew = [
    { kind: 'UPDATED PLAYLIST', title: 'R&B Now', sub: 'R&B',
      caption: 'Drake is in a complicated relationship on "Solar Eclipse."' },
    { kind: 'NEW ALBUM', title: 'She’s the Best', sub: 'Troye Sivan',
      caption: 'Hard truths on LP4: “This record is tougher for me, because it’s uglier.”' },
    { kind: 'PRE-ADD ALBUM', title: 'How To Quit Smoking', sub: 'Dominic Fike',
      caption: 'Expected October 30, 2026' }
  ];

  const editorialShelves = {
    'Best New Songs': ['Chelsea Boo...', 'Paradise', 'Sinful Obsession', 'Uncertain, T...', 'Dead Comp...'],
    'New This Week': ['Mosquito', "She's the Best", 'Comfort', 'Text'],
    'More to Explore': ['Heat Waves', 'Sunflower', 'Savage Love', 'Savage Love']
  };

  root.OCTAVE_DEMO_DATA = {
    tracks: tracks,
    trackById: tracks.reduce(function (m, t) { m[t.id] = t; return m; }, {}),
    albums: albums,
    artists: artists,
    artistTopSongs: artistTopSongs,
    playlists: playlists,
    stations: stations,
    editorialRadio: editorialRadio,
    genres: genres,
    moodCategories: moodCategories,
    searchCategories: searchCategories,
    podcastEditorial: podcastEditorial,
    podcastGenres: podcastGenres,
    shows: shows,
    podcastChartCategories: podcastChartCategories,
    episodesLightBox: episodesLightBox,
    episodesTrailers: episodesTrailers,
    lightBoxInfo: lightBoxInfo,
    clancyChapters: clancyChapters,
    clancyDescription: clancyDescription,
    settingsSections: settingsSections,
    shortcuts: shortcuts,
    lyrics: lyrics,
    trending: trending,
    newMusic: newMusic,
    cities: cities,
    editorialNew: editorialNew,
    editorialShelves: editorialShelves,
    storefronts: [
      { code: 'US', flag: '🇺🇸', name: 'United States' },
      { code: 'CA', flag: '🇨🇦', name: 'Canada' },
      { code: 'GB', flag: '🇬🇧', name: 'United Kingdom' },
      { code: 'AU', flag: '🇦🇺', name: 'Australia' },
      { code: 'DE', flag: '🇩🇪', name: 'Germany' },
      { code: 'FR', flag: '🇫🇷', name: 'France' },
      { code: 'JP', flag: '🇯🇵', name: 'Japan' },
      { code: 'BR', flag: '🇧🇷', name: 'Brazil' }
    ]
  };
})(window);