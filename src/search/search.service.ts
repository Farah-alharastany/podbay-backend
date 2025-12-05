import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Podcast } from './podcast.entity';
import { Episode } from './episode.entity';

@Injectable()
export class SearchService {
  constructor(
    private httpService: HttpService,
    @InjectRepository(Podcast)
    private podcastRepo: Repository<Podcast>,
    @InjectRepository(Episode)
    private episodeRepo: Repository<Episode>,
  ) {}

  async searchAndSave(term: string) {
    // 1. البحث عن البودكاستات
    const podcastUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=podcast`;
    const podcastResponse = await lastValueFrom(
      this.httpService.get(podcastUrl),
    );
    const podcastResults = podcastResponse.data.results;

    const podcasts: any[] = [];

    for (const item of podcastResults) {
      if (!item.feedUrl) continue;

      let podcast = await this.podcastRepo.findOne({
        where: { itunesId: item.trackId },
      });

      if (!podcast) {
        podcast = this.podcastRepo.create({
          itunesId: item.trackId,
          title: item.trackName,
          artist: item.artistName,
          image: item.artworkUrl600,
          feedUrl: item.feedUrl,
        });
        podcast = await this.podcastRepo.save(podcast);
      }

      podcasts.push(podcast);
    }

    // 2. البحث عن حلقات البودكاست (باستخدام نفس المصطلح)
    const episodesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=podcast&entity=podcastEpisode`;
    const episodesResponse = await lastValueFrom(
      this.httpService.get(episodesUrl),
    );
    const episodeResults = episodesResponse.data.results;

    const episodes: any[] = [];

    for (const ep of episodeResults) {
      // إذا أردت تحديد عدد معين من الحلقات (مثلاً 10)
      if (episodes.length >= 10) break;

      const exists = await this.episodeRepo.findOne({
        where: { itunesId: ep.trackId },
      });

      if (!exists) {
        // هنا لا نربط الحلقة بأي بودكاست (بدون علاقة)
        const episode = this.episodeRepo.create({
          itunesId: ep.trackId,
          title: ep.trackName,
          description: ep.shortDescription,
          image: ep.artworkUrl600,
          audioUrl: ep.episodeUrl || ep.previewUrl || '',
          releaseDate: ep.releaseDate,
          // لا نمرر podcast هنا - بدون علاقة
        });
        const savedEp = await this.episodeRepo.save(episode);
        episodes.push(savedEp);
      }
    }

    // 3. إرجاع النتائج في نفس الرد
    return {
      podcasts: podcasts,
      episodes: episodes,
    };
  }
}
