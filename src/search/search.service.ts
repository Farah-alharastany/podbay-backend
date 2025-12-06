import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Podcast } from './entities/podcast.entity';
import { Episode } from './entities/episode.entity';

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
          collectionViewUrl: item.collectionViewUrl,
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
      const exists = await this.episodeRepo.findOne({
        where: { itunesId: ep.trackId },
      });

      if (!exists) {
        const episode = this.episodeRepo.create({
          itunesId: ep.trackId,
          title: ep.trackName,
          collectionName: ep.collectionName,
          description: ep.shortDescription,
          image: ep.artworkUrl600,
          audioUrl: ep.episodeUrl || ep.previewUrl || '',
          releaseDate: ep.releaseDate,
        });

        const savedEp = await this.episodeRepo.save(episode);
        episodes.push(savedEp);
      } else {
        // ✅ أضيفي الحلقة الموجودة أيضًا إلى النتائج
        episodes.push(exists);
      }
    }

    // 3. إرجاع النتائج في نفس الرد
    return {
      podcasts: podcasts,
      episodes: episodes,
    };
  }
}
