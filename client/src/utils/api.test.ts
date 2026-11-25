import { AxiosError } from 'axios'
import { describe, expect, it } from 'vitest'
import { getErrorMessage } from '../services/api'

describe('getErrorMessage', () => {
  it('берёт сообщение сервера', () => {
    const error = new AxiosError('fail', '400', undefined, undefined, {
      status: 400, statusText: '', headers: {}, config: {} as never, data: { message: 'Неверный пароль' },
    })
    expect(getErrorMessage(error)).toBe('Неверный пароль')
  })
  it('нет ответа — нет связи', () => {
    expect(getErrorMessage(new AxiosError('Network Error'))).toBe('Нет связи с сервером')
  })
  it('ответ без текста', () => {
    const error = new AxiosError('fail', '500', undefined, undefined, {
      status: 500, statusText: '', headers: {}, config: {} as never, data: {},
    })
    expect(getErrorMessage(error)).toBe('Произошла ошибка на сервере')
  })
  it('не-axios ошибка', () => expect(getErrorMessage(new Error('x'))).toBe('Произошла неизвестная ошибка'))
})
