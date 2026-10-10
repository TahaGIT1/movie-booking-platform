import { prisma } from '../src/config/prisma.js';

const topThreeMovies = [
  {
    title: 'Drishyam The Conclusion',
    synopsis: '7 years after the case related to Vijay Salgaonkar and his family was closed, a series of unexpected events bring a truth to light that threatens to change everything for the Salgaonkars. Can Vijay protect his family one last time?',
    durationMinutes: 140,
    censorCertificate: 'U/A',
    originalLanguage: 'Hindi',
    supportedLanguages: ['Hindi', 'Telugu', 'Tamil', 'Kannada', 'Malayalam'],
    genres: ['Drama', 'Mystery', 'Thriller'],
    castMembers: [
      { name: 'Ajay Devgn', role: 'Vijay Salgaonkar' },
      { name: 'Tabu', role: 'Meera Deshmukh' },
      { name: 'Shriya Saran', role: 'Nandini Salgaonkar' },
      { name: 'Jaideep Ahlawat', role: 'SP Rajveer Singh Tomar' },
      { name: 'Prakash Raj', role: 'Public Prosecutor Indrajith Shetty' },
      { name: 'Rajat Kapoor', role: 'Mahesh Deshmukh' },
      { name: 'Ishita Dutta', role: 'Anju Salgaonkar' },
      { name: 'Kamlesh Sawant', role: 'Sub-Inspector Gaitonde' }
    ],
    director: 'Abhishek Pathak',
    posterUrl: 'https://assets-in.bmscdn.com/discovery-catalog/events/tr:w-400,h-600,bg-CCCCCC,e-usm-2-2-0.5-0.008:w-400.0,h-660.0,cm-pad_resize,bg-000000,fo-top:l-image,i-discovery-catalog@@icons@@star-icon-202203010609.png,lx-24,ly-615,w-29,l-end:l-text,ie-OC45LzEwICA4My44SysgVm90ZXM%3D,fs-29,co-FFFFFF,ly-612,lx-70,pa-8_0_0_0,l-end/et00477911-leqzyrmedu-portrait.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=cxA2y-402w0',
    releaseDate: new Date('2026-10-02')
  },
  {
    title: 'Premada Oorali',
    synopsis: 'Premada Oorali is a heartfelt Kannada romantic family drama depicting deep rural emotional bonds, love, and traditional village values against personal aspirations in contemporary Karnataka.',
    durationMinutes: 127,
    censorCertificate: 'U/A',
    originalLanguage: 'Kannada',
    supportedLanguages: ['Kannada'],
    genres: ['Romantic', 'Family', 'Drama'],
    castMembers: [
      { name: 'Shree Raam', role: 'Santu' },
      { name: 'Thapaswini Poonacha', role: 'Rukmini' },
      { name: 'Ramika Shivu', role: 'Vasantha' },
      { name: 'Rangayana Raghu', role: 'Village Elder' },
      { name: 'Govinde Gowda', role: 'Supporting Role' },
      { name: 'Abhishek Kalmani', role: 'Supporting Role' }
    ],
    director: 'Manoj Kumar',
    posterUrl: 'https://assets-in.bmscdn.com/discovery-catalog/events/tr:w-400,h-600,bg-CCCCCC,e-usm-2-2-0.5-0.008:w-400.0,h-660.0,cm-pad_resize,bg-000000,fo-top:l-image,i-discovery-catalog@@icons@@star-icon-202203010609.png,lx-24,ly-615,w-29,l-end:l-text,ie-OS42LzEwICA1Mi41SysgVm90ZXM%3D,fs-29,co-FFFFFF,ly-612,lx-70,pa-8_0_0_0,l-end/et00412717-wvjrzytadp-portrait.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=eB8g_0uK1iE',
    releaseDate: new Date('2026-09-25')
  },
  {
    title: 'Bail',
    synopsis: "A retired police commissioner turns into an outlaw to seek vigilante justice after his daughter's tragic demise in a terror attack, targeting hardened criminals who escaped imprisonment by exploiting legal bail loopholes.",
    durationMinutes: 141,
    censorCertificate: 'U/A',
    originalLanguage: 'Kannada',
    supportedLanguages: ['Kannada', 'Hindi', 'Telugu', 'Tamil'],
    genres: ['Action', 'Crime', 'Thriller', 'Drama'],
    castMembers: [
      { name: 'Shiva Rajkumar', role: 'Vijay Kumar (Retired CP)' },
      { name: 'Sai Kumar', role: 'Senior Police Officer' },
      { name: 'Jayaram', role: 'DGP Raghavan' },
      { name: 'Dheekshith Shetty', role: 'Investigating Officer' },
      { name: 'Yogesh (Yogi)', role: 'Syndicate Boss' },
      { name: 'Sanjana Anand', role: 'Advocate Meera' },
      { name: 'Rupali Sood', role: 'Ananya' }
    ],
    director: 'Pavan Wadeyar',
    posterUrl: 'https://assets-in.bmscdn.com/discovery-catalog/events/tr:w-400,h-600,bg-CCCCCC,e-usm-2-2-0.5-0.008:w-400.0,h-660.0,cm-pad_resize,bg-000000,fo-top:l-image,i-discovery-catalog@@icons@@star-icon-202203010609.png,lx-24,ly-615,w-29,l-end:l-text,ie-OS4xLzEwICAzLjJLKyBWb3Rlcw%3D%3D,fs-29,co-FFFFFF,ly-612,lx-70,pa-8_0_0_0,l-end/et00517163-nhfpnnsfdt-portrait.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=uF_i71k4oBw',
    releaseDate: new Date('2026-10-02')
  }
];

async function seedTopMovies() {
  console.log('Seeding / updating BookMyShow metadata for top 3 movies...');
  for (const movieData of topThreeMovies) {
    const existing = await prisma.movie.findFirst({
      where: { title: { equals: movieData.title, mode: 'insensitive' } }
    });

    if (existing) {
      const updated = await prisma.movie.update({
        where: { id: existing.id },
        data: movieData
      });
      console.log(`Updated "${updated.title}" with id ${updated.id}`);
    } else {
      const created = await prisma.movie.create({
        data: movieData
      });
      console.log(`Created "${created.title}" with id ${created.id}`);
    }
  }
  console.log('Finished updating top 3 movies with BookMyShow data!');
  await prisma.$disconnect();
}

seedTopMovies().catch(err => {
  console.error('Error seeding movies:', err);
  process.exit(1);
});
