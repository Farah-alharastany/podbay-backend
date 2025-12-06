import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Podcast } from './podcast.entity';

@Entity()
export class Episode {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'bigint', nullable: true })
  itunesId: string;

  @Column()
  title: string;
  @Column()
  collectionName: string;
  
  @Column('text', { nullable: true })
  description: string;

  @Column()
  image: string;

  @Column()
  audioUrl: string;

  @Column()
  releaseDate: string;

  @ManyToOne(() => Podcast, (podcast) => podcast.episodes)
  podcast: Podcast;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
